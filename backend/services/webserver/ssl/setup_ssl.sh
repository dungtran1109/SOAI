#!/bin/bash

SRC_WORKDIR="/etc/nginx/ssl"
REQUIRED_FILES=(".crt" ".key")
DEST_DIR="$SRC_WORKDIR/certs"

ME="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
LOG="/var/log/$ME"

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

function setup_symlink()
{
    ext=$1
    info "setting up symlink for a file with '$ext' extension"
    # In case the file is a regular file, we delete it
    if [ -f "$DEST_DIR/cert$ext" ] && [ ! -L "$DEST_DIR/cert$ext" ]; then
        info "Deleting $DEST_DIR/cert$ext since it's a regular file"
        rm -rf "$DEST_DIR/cert$ext"
    fi

    # we'll find the corresponding file in confirmed...
    f=$(find "$DEST_DIR/confirmed" -maxdepth 1 ! -type l -exec basename {} \; | grep "$ext$")

    # ... and create a symlink to the file in the confirmed folder.
    ln -sf "confirmed/$f" "$DEST_DIR/cert$ext"
    info "symlink $DEST_DIR/cert$ext -> confirmed/$f created."

}

function install_certificates()
{
    # This is a fallback method. 
    # If this folder doesn't exist, the volume have probably not 
    # been mounted. 
    # This is a bummer, since uploaded certificates will "vanish"
    # if the container is restarted.
    # However, the service will at least be up and running with the
    # default certificate.
    [ ! -d "$DEST_DIR" ] && mkdir "$DEST_DIR"

    # Create neccessary folders, in case they don't exist
    [ ! -d "$DEST_DIR/confirmed" ] && mkdir "$DEST_DIR/confirmed"
    [ ! -d "$DEST_DIR/unconfirmed" ] && mkdir "$DEST_DIR/unconfirmed"
    [ ! -d "$DEST_DIR/backup" ] && mkdir "$DEST_DIR/backup"

    # In case there are not exactly two files in the confirmed folder, 
    # the image may have been started for the first time or we are
    # in an unknown and unsupported state.
    if [ $(ls "$DEST_DIR/confirmed" | wc -l) -ne 2 ]
    then

        info "setup default certificate..."

        # Remove any existing files otherwise we can't reliably create a symlink
        if [ $(ls "$DEST_DIR/confirmed" | wc -l) -gt 0 ]; then
            info "delete existing files in $DEST_DIR/confirmed/"
            find "$DEST_DIR/confirmed" -maxdepth 1 -type f -delete
        fi

        for ext in ${REQUIRED_FILES[@]}; do

            # Find the default file name with a required file extension. 
            # This file should have been copied from the repository 
            # when the image was created.
            f=$(find "$SRC_WORKDIR" -maxdepth 1 ! -type l -exec basename {} \; | grep "$ext$")

            # Copy the default file to the confirmed folder
            cp "$SRC_WORKDIR/$f" "$DEST_DIR/confirmed/$f"

            info "$f copied to $DEST_DIR/confirmed/$f"

            # If there is a symlink, we probably need to update it
            setup_symlink "$ext"

        done

    fi

    # This is just a precaution. In case we skipped installing the
    # default certificate above, we make sure there are symlinks pointing
    # to files in the confirmed folder.
    for ext in ${REQUIRED_FILES[@]}; do

        # nginx is assumed to be setup to load "$DEST_DIR/cert$ext" and
        # it's supposed to be a symlink.
        # Verifying the symlinks exists and create them if the don't
        if [ ! -L "$DEST_DIR/cert$ext" ]; then
            info "$DEST_DIR/cert$ext is missing, setup symlink"
            setup_symlink "$ext"
        fi

    done

}

install_certificates
