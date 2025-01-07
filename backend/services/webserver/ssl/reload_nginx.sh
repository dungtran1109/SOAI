#!/bin/bash

# Typically something wrong with the certificate 
# and/or key file. 
# The client probably supplied invalid certificate
# and/or key file. This may be the result of using
# the wrong key for the certificate file, confusing 
# the certificate for key or using unsupported
# certificate format. Or any other type of error 
# preventing nginx from using the certificate and key files.
CODE_INVALID_KEY_PAIR=40

# Typically internal server error issues.
# Nothing the client can resolve. Needs to be investigated 
# further and debugged.
CODE_FAILED_TO_SWITCH_CERTIFICATES=51
CODE_NGINX_CONFIGURATION_ERROR=52
CODE_CERTIFICATE_FOLDER_EMPTY=53
CODE_FAILED_SYMLINK_ENABLING_CERTIFICATE=54
CODE_DIRECTORY_NOT_FOUND=55
CODE_BACKUP_FAILED=56
CODE_CERTIFICATE_INSTALLATION_FAILED=57
CODE_COULD_NOT_CREATE_DIRECTORY=58


ME="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
LOG="/var/log/$ME"

VALIDATE_DIR="unconfirmed"
CONFIRMED_DIR="confirmed"
BACKUP_DIR="backup"
REQUIRED_FILES=(".crt" ".key")
SSL_DIR="/etc/nginx/ssl/certs"
WORKDIR=$SSL_DIR

SYMLINKS=()

cd "$WORKDIR"

function log()
{
	NOW=$(date +"%Y-%m-%d %T%:z")
	printf "$NOW $1\n" >> "$LOG"
}

function err()
{
	errmsg="[ ERROR ] $1"
	echo "$errmsg"
	log "$errmsg"
}

function info()
{
	nfomsg="[ INFO  ] $1" 
	echo "$nfomsg"
	log "$nfomsg"
}

function exit_with_error()
{
	errmsg="[ ERROR ] $1"
    echo "$errmsg" >&2
	log "$errmsg"

    if [ -z $2 ]
    then
        exit 1
    fi
    exit $2

}

function create_new_symlinks()
{
	FOLDER=$1
	CERTIFICATE_FILES=()
	OIFS="$IFS"
	IFS=$'\n'

	for f in $(ls "$1" | grep '.crt\|.key')
       	do
		CERTIFICATE_FILES[${#CERTIFICATE_FILES[@]}]=$f
	done

	IFS="$OIFS"

	for filepath in "${CERTIFICATE_FILES[@]}"
        do
		
		read -a symlinksarr <<< "$filepath"

		FILE=$(basename "$filepath")
		EXTENSION="${FILE##*.}"
		LINKNAME="cert.${EXTENSION}"

		ln -sf "$FOLDER/$FILE" "$SSL_DIR/$LINKNAME"
		if [[ $? -ne 0 ]];then
			exit_with_error "Failed creating symlink" $CODE_FAILED_SYMLINK_ENABLING_CERTIFICATE
		fi

		if [ ! -e "$SSL_DIR/$LINKNAME" ] ; then
			exit_with_error "Failed creating symlink" $CODE_FAILED_SYMLINK_ENABLING_CERTIFICATE
		else
			info "link $SSL_DIR/$LINKNAME -> $FOLDER/$FILE created"
		fi
	done
}

function backup()
{
	DATE=$(date +%Y-%m-%dT%H_%M_%S)

	BACKUP_CMD=$(mv "$CONFIRMED_DIR" "$BACKUP_DIR/$DATE" 2>&1)

	if [[ $? -ne 0 ]];then
		exit_with_error $BACKUP_CMD $CODE_BACKUP_FAILED
	fi

	info "backup complete, '$CONFIRMED_DIR' moved to '$BACKUP_DIR/$DATE'"

}

function required_folder_with_certificate_files()
{
	if [ -d "$1" ]
	then
		if [ ! "$(ls -A $1)" ]; then
		exit_with_error "'$1'-folder is empty" $CODE_CERTIFICATE_FOLDER_EMPTY
		fi
	else
		exit_with_error "Directory '$1' not found." $CODE_DIRECTORY_NOT_FOUND
	fi

	for ext in ${REQUIRED_FILES[@]}; do
		if [ $(ls "$1" | grep "$ext" | wc -l) != 1 ]
		then
			exit_with_error "Expected exactly on file with extension '$ext' in folder '$1'" $CODE_INVALID_KEY_PAIR
		fi
	done

}

function activate()
{
	required_folder_with_certificate_files "$VALIDATE_DIR"

	backup

	ACTIVATE_CMD=$(mv "$VALIDATE_DIR" "$CONFIRMED_DIR" 2>&1)

	if [[ $? -ne 0 ]];then
		exit_with_error $ACTIVATE_CMD $CODE_CERTIFICATE_INSTALLATION_FAILED
	fi

	info "'$VALIDATE_DIR' moved to '$CONFIRMED_DIR'"

	MKDIR_VALIDATE_CMD=$(mkdir "$VALIDATE_DIR" 2>&1)

	if [[ $? -ne 0 ]];then
		exit_with_error $MKDIR_VALIDATE_CMD $CODE_COULD_NOT_CREATE_DIRECTORY
	fi

	info "folder '$VALIDATE_DIR' created"

	create_new_symlinks "$CONFIRMED_DIR"
}

function revert()
{
	required_folder_with_certificate_files "$CONFIRMED_DIR"

	create_new_symlinks "$CONFIRMED_DIR"
}

function validate()
{
	required_folder_with_certificate_files "$VALIDATE_DIR"

	info "setting up new certificate"

	create_new_symlinks "$VALIDATE_DIR"
}

function clear()
{
	RM_VALIDATE_CMD=$(rm -rf "$VALIDATE_DIR/"* 2>&1)

	if [[ $? -ne 0 ]];then
		exit_with_error $RM_VALIDATE_CMD $CODE_COULD_NOT_CREATE_DIRECTORY
	fi

	info "files in '$VALIDATE_DIR' folder deleted"
}


function temporary_activate_new_certificates()
{
    validate
}

function rollback_certificates()
{
    revert
}

function save_new_certificates()
{
    activate
}

function remove_invalid_certificates()
{
    clear
}

function test_new_nginx_config()
{

	info "test new certificate in nginx"

	CMDMSG=$(/etc/init.d/nginx configtest 2>&1)
	if [[ $? -ne 0 ]]
	then
		err "$CMDMSG" 

        info "attempting to rollback previous certificate"
		rollback_certificates

        info "delete invalid certificate key pair"
		remove_invalid_certificates

		validate_nginx_config

        exit_with_error "invalid certificate key pair deleted and previous certificate restored" $CODE_INVALID_KEY_PAIR
	fi

	info "nginx configuration test passed"
}

function validate_nginx_config()
{
	info "testing current nginx configuration..."

	CMDMSG=$(/etc/init.d/nginx configtest 2>&1)
	if [[ $? -ne 0 ]]
	then
		err "nginx: $CMDMSG"  

		exit_with_error "nginx configuration error" $CODE_NGINX_CONFIGURATION_ERROR
	fi

	info "nginx configuration test passed"
}

function restart_nginx()
{
	CMDMSG=$(/etc/init.d/nginx reload 2>&1)
	if [[ $? -ne 0 ]]
	then
		err "nginx: $CMDMSG" 
		rollback_certificates
		exit_with_error "nginx reload failed" $CODE_NGINX_RELOAD_FAILED
	fi

	info "nginx reloaded"
}

info "STARTED"

# Validate we're actually starting with a working configuration.
validate_nginx_config

# Temporarily activate the new certificate and key
temporary_activate_new_certificates

# Test the new certificate and key
test_new_nginx_config

#Persist the changes
save_new_certificates

# Reload nginx with the certifcate/key
restart_nginx

info "new certificates installed."

exit 0
