#! /bin/bash
##
## vas.sh
##--------

# Directory
test -n "$VAS_GIT" || export VAS_GIT=$(pwd -P)
test -n "$TEST_DIR" || export TEST_DIR="$VAS_GIT/test"
test -n "$BUILD_DIR" || export BUILD_DIR="$VAS_GIT/build"
test -n "$RELEASE" || export RELEASE=false
test -n "$DOCKER_DIR" || export DOCKER_DIR="$VAS_GIT/docker"
# HELM Chart set up
test -n "$HELM_DIR" || export HELM_DIR="$BUILD_DIR/helm-build/soai-application"
test -n "$HELM_CHART_DIR" || export HELM_CHART_DIR="$VAS_GIT/helm/soai-application"
test -n "$DOCKER_REGISTRY" || export DOCKER_REGISTRY="192.168.122.65:30443/soai-application"

prg=$(basename $0) # vas.sh filename
dir=$(dirname $0); dir=$(cd $dir; pwd) #Get root dir
me=$dir/$prg #Get absolutely path vas.sh
vas=$me
#Get the release commit
git_commit=$(git --git-dir="$VAS_GIT/.git" rev-parse --short=7 HEAD)
change_id=$(git show $git_commit | grep '^\ *Change-Id' | awk '{print $2}')
release=$git_commit

clean() {
    echo "Remove build directory..."
    rm -rf "$VAS_GIT/build"
    echo "Remove sucessfully"
}

die() {
    echo "ERROR: $1" >&2
    exit 1
}

help() {
    grep '^##' $0 | cut -c3-
    exit 0
}

test -n "$1" || help
echo "$1" | grep -qi "^help\|-h" && help

dir_est() {
    echo "Creating [BUILD] directories if they do not exist..."

    # Check and create BUILD_DIR if it does not exist
    if [ ! -d "$BUILD_DIR" ]; then
        echo "Creating $BUILD_DIR..."
        mkdir -p "$BUILD_DIR"
    else
        echo "$BUILD_DIR already exists. Skipping creation."
    fi

    echo "Directory setup complete."
}

get_version() {
    test -n "$BUILD/var" || mkdir $BUILD/var
    if [[ "$RELEASE" = true ]]; then
        if [[ -s $BUILD_DIR/var/.release_version ]]; then
            cat $BUILD_DIR/var/.release_version
            exit 0
        fi
        release_version=$(git tag | sort -V | tail -1)
        echo "${release_version}"
    else
        if [[ -s $BUILD_DIR/var/.version ]]; then
            cat $BUILD_DIR/var/.version
            exit 0
        fi
        suffix=$(git rev-parse HEAD | sed 's/^0*//g' | cut -c1-7 | tr 'a-f' '1-6')
        suffix+=$(git diff --quiet && git diff --cached --quiet || echo '9999')
        echo "$(<$VAS_GIT/VERSION_PREFIX)-${suffix}"
    fi
}

# This will mount UID/GID in Dockerfile in order to run as non-root user
get_user_id() {
    local_container=$1
    local hash=$(sha256sum <<< "${container}" | cut -f1 -d ' ')
    bc -q <<< "scale=0;obase=10;ibase=16;(${hash^^}%30D41)+186A0"
}

# Copy CA file to helm charts => This will need to create TLS secrets in helm chart with cert-manager
generate_ca() {
    test -n "$HELM_CHART_DIR" || die "Module [HELM_CHART_DIR] not set"
    test -n "$TEST_DIR" || die "Module [TEST_DIR] not set"

    SSL_TEST_DIR="$TEST_DIR/ssl"
    HELM_TEMPLATE_FILE_DIR="$HELM_CHART_DIR/files"
    gen_ca_path="$TEST_DIR/generate_ca.sh"
    key_file="ca.key"
    cert_file="ca.crt"

    echo "############### Generating Ceritificate Authority ############"
    $gen_ca_path

    # Check if HELM_TEMPLATE_FILE_DIR exists, if not, create the directory
    if [ ! -d "$HELM_TEMPLATE_FILE_DIR" ]; then
        echo "Creating directory $HELM_TEMPLATE_FILE_DIR"
        mkdir -p "$HELM_TEMPLATE_FILE_DIR" \
            || die "Failed to create directory $HELM_TEMPLATE_FILE_DIR"
    fi

    echo "############### Certificates ############"
    # Copy ca key file
    cp -f "$SSL_TEST_DIR/$key_file" "$HELM_TEMPLATE_FILE_DIR/$key_file" \
        || die "Failed to copy $SSL_TEST_DIR/$key_file to $HELM_TEMPLATE_FILE_DIR/$key_file"
    echo "Copy $cert_file file from $SSL_TEST_DIR/$cert_file to $HELM_TEMPLATE_FILE_DIR/$cert_file"
    # Copy ca cert file
    cp -f "$SSL_TEST_DIR/$cert_file" "$HELM_TEMPLATE_FILE_DIR/$cert_file" \
        || die "Failed to copy $SSL_TEST_DIR/$cert_file to $HELM_TEMPLATE_FILE_DIR/$cert_file"s
}

## build_image
## Build docker image from Dockerfile
##
## --name=<module name>
##
build_image() {
    test -n "$VAS_GIT" || die "Not set [VAS_GIT]"
    test -n "$__name" || die "Module name required"
    image_name=soai-$__name
    # default target_dir
    target_dir="$VAS_GIT/backend/services/$__name"

    version=$(get_version)

    if [ $__name == "web" ]; then
        target_dir="$VAS_GIT/$__name"
    fi

    docker build $target_dir \
            --file $target_dir/Dockerfile \
            --tag "$DOCKER_REGISTRY/$image_name:$version" \
            --build-arg COMMIT=$git_commit \
            --build-arg APP_VERSION=$version \
            --build-arg BUILD_TIME=`date +"%d/%m/%Y:%H:%M:%S"` \
            --build-arg USER_ID=$(get_user_id) \
        || die "Failed to build docker images: $__name"
}

## save_image
## Save image from local build repository
##
## --name=<module name>
##
save_image() {
    test -n "$VAS_GIT" || die "Not set [VAS_GIT]"
    test -n "$__name" || die "Module name required"
    image_name=soai-$__name

    mkdir -p $BUILD_DIR/images
    cd $BUILD_DIR/images
    version=$(get_version)

    echo "Save image: $image_name"
    rm -rf ${image_name}:$version.tgz && rm -rf ${image_name}:$version.sha256
    docker save $DOCKER_REGISTRY/${image_name}:$version \
            | gzip -vf - > ${image_name}-$version.tgz
    sha256sum "${image_name}-$version.tgz" > "${image_name}-$version.sha256"
    cat "${image_name}-$version.sha256"
}

## create helm_md5sum
## Create the md5sum file for Helm chart
##
create_helm_md5sum() {
    cd $BUILD_DIR/helm-build/soai-application
    version=$(get_version)
    md5sum "soai-application-$version.tgz" > "soai-application-$version.md5sum"
    cat "soai-application-$version.md5sum"
}

## build_helm
## Packages the helm chart for checking application
##
## --release=<true/false>
##
build_helm() {
    test -n "$__release" && export RELEASE=$__release
    test -n "$__user" || __user=$USER

    local version=$(get_version)

    destination="${VAS_GIT}/build/helm-build"
    rm -rf $destination && mkdir $destination
    chart="${VAS_GIT}/helm/soai-application/Chart.yaml"
    soai_chart_name=$(basename $(dirname $chart))
    
    source_tmp="${VAS_GIT}/build/.helm_temp_ws"
    source="$source_tmp/$soai_chart_name"
    rm -rf $source_tmp && mkdir $source_tmp
    if [ ! -d $source ]; then
        cp -r ${VAS_GIT}/helm/$soai_chart_name $source
    fi 

    mkdir -p "$destination/$soai_chart_name"

    # Update Chart.yaml version
    sed -i -e "s|^version: .*|version: ${version}|" $source/Chart.yaml \
        || die "[FAILED] Unable to change version: ${version} in $source/Chart.yaml"

    # Update soai-product-info.yaml with version
    sed -i -e "s|%%VERSION%%|${version}|" $source/soai-product-info.yaml \
        || die "[FAILED] Unable to change version: ${version} in $source/soai-product-info.yaml"

    # Update soai-product-info.yaml with Docker registry
    sed -i -e "s|%%REGISTRY%%|${DOCKER_REGISTRY}|" $source/soai-product-info.yaml \
        || die "[FAILED] Unable to change %%REGISTRY%% to ${DOCKER_REGISTRY} in $source/soai-product-info.yaml"
    
    helm package $source \
        --dependency-update \
        --destination $destination/$soai_chart_name \
        --version $version \
    || die "Failed to package helm chart"

    soai_chart_path="$destination/$soai_chart_name/$soai_chart_name-$version.tgz"

    #Untar the ck chart
    tar -xvf $soai_chart_path -C "$(dirname $soai_chart_path)"

    create_helm_md5sum
}

## Push image
## Push docker image to Docker Registry
##
## --name=<module name>
##
push_image() {
   test -n "$VAS_GIT" || die "Not set [VAS_GIT]"
   test -n "$__name" || die "Module name required"
   test -n "$DOCKER_REGISTRY" || die "Not set [DOCKER_REGISTRY]"
   image_name=soai-$__name
   version=$(get_version)

   ## Docker push to docker registry
   docker push $DOCKER_REGISTRY/$image_name:$version \
	   || die "Failed to push docker registry: $DOCKER_REGISTRY"
}

## Push helm
## Push helm package to Docker Registry
##
## --name=<module name>
##
push_helm() {
    if [ $RELEASE == true ]; then
        test -n "$VAS_GIT" || die "Not set [VAS_GIT]"
        test -n "$DOCKER_REGISTRY" || die "Not set [DOCKER_REGISTRY]"
        test -n "$HELM_DIR" || die "Not set [HELM_DIR]"
        image_name=soai-$__name
        version=$(get_version)
        registry=oci://registry-1.docker.io

        echo "RELEASE is true. Push helm chart to $registry/$DOCKER_REGISTRY"
        ## Helm push to docker registry
        helm push $HELM_DIR/soai-application-$version.tgz \
                $registry/$DOCKER_REGISTRY \
                || die "Failed to push helm chart to $registry/$DOCKER_REGISTRY"
    else
        echo "RELEASE is false. Skip to push helm chart"
    fi
}

#Get the command
cmd=$1
shift
grep -q "^$cmd()" $0 || die "Invalid command [$cmd]"

while echo "$1" | grep -q '^--'; do
    if echo $1 | grep -q =; then
        o=$(echo "$1" | cut -d= -f1 | sed -e 's,-,_,g')
        v=$(echo "$1" | cut -d= -f2-)
        eval "$o=\"$v\""
    else
        o=$(echo "$1" | sed -e 's,-,_,g')
		eval "$o=yes"
    fi
    shift
done
unset o
long_opts=`set | grep '^__' | cut -d= -f1`

#Execute command
trap "die Interrupted" INT TERM
$cmd "$@"
status=$?
exit $status
