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
test -n "$DOCKER_REGISTRY" || export DOCKER_REGISTRY="anhdung12399/soai-application"

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

## dir_est
## Set up DIR for deployment
##
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

## get_version
## Get release version or dirty version
## This is needed for building helm chart and package docker images
##
## export RELEASE=true/false
##
get_version() {
    mkdir -p "$BUILD_DIR/var"

    # Read version prefix from file
    test -f "$VAS_GIT/VERSION_PREFIX" || die "Missing VERSION_PREFIX file"
    version_prefix=$(cat "$VAS_GIT/VERSION_PREFIX")

    # Get commit count in current branch
    commit_count=$(git rev-list --count HEAD)

    # Compose base version
    base_version="${version_prefix}-${commit_count}"

    if [[ "$RELEASE" = true ]]; then
        # Priority to get the version in file first. Avoiding to get new version released
        if [[ -s $BUILD_DIR/var/.release_version ]]; then
                cat $BUILD_DIR/var/.release_version
                exit 0
        fi
        echo "$base_version" > "$BUILD_DIR/var/.release_version"
        echo "$base_version"
    else
        # Priority to get the version in file first. Avoid to get new version when new commit comes.
        if [[ -s $BUILD_DIR/var/.version ]]; then
            cat $BUILD_DIR/var/.version
            exit 0
        fi
        # Generate suffix if working directory is dirty
        suffix=$(git rev-parse HEAD | sed 's/^0*//g' | cut -c1-7 | tr 'a-f' '1-6')
        suffix+=$(git diff --quiet && git diff --cached --quiet || echo '9999')

        version="${base_version}${suffix}"
        echo "$version" > "$BUILD_DIR/var/.version"
        echo "$version"
    fi
}

## create_git_tag
## Create the git tag and push the git tag to git
## For create drop release version
##
create_git_tag() {
    test -n "$VAS_GIT" || die "Not set [VAS_GIT]"
    test -d "$VAS_GIT/.git" || die "Not a git repository: $VAS_GIT"
    version=$(get_version)

    # Check if the tag already exists
    if git tag | grep -qx "$version"; then
        echo "Tag $version already exists. Skipping creation."
        return 0
    fi

    echo "Creating Git tag: $version"
    git tag -a "$version" -m "Release version $version" || die "Failed to create git tag $version"
    git push origin "$version" || die "Failed to push git tag $version to origin"

    echo "Git tag $version created and pushed successfully."
}

## get_user_id
## This will mount UID/GID in Dockerfile in order to run as non-root user
##
get_user_id() {
    local_container=$1
    local hash=$(sha256sum <<< "${container}" | cut -f1 -d ' ')
    bc -q <<< "scale=0;obase=10;ibase=16;(${hash^^}%30D41)+186A0"
}

## Copy CA file to helm charts
## This will need to create TLS secrets in helm chart with cert-manager
##
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

## create helm_md5sum
## Create the md5sum file for Helm chart for validation
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

## push_image
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

# Ensure Docker network exists
ensure_network() {
    local network_name="soai-net"
    if ! docker network ls --format '{{.Name}}' | grep -wq "$network_name"; then
        echo "Creating Docker network: $network_name"
        docker network create "$network_name"
    else
        echo "Docker network $network_name already exists"
    fi
}

## run_image
## Run a docker container from the built image
## Matches image: $DOCKER_REGISTRY/soai-<module>:<version>
## Sets container name: soai_<module>
##
## --name=<module name>
## --port=<host:container>       (optional)
## --env="KEY=VALUE ... KEY2=VAL" (optional)
## --cmd="<command to run inside container>" (optional)
##
run_image() {
    test -n "$__name" || die "Module name required"
    image_name="soai-$__name"
    container_name="soai_$__name"
    version=$(get_version)
    full_image="$DOCKER_REGISTRY/$image_name:$version"

    echo "Running container: $container_name from image: $full_image"
    ensure_network

    # Stop & remove existing container if exists
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${container_name}$"; then
        echo "Container already exists. Removing..."
        docker rm -f "$container_name"
    fi

    # Prepare port mapping
    port_arg=""
    if [ -n "$__port" ]; then
        port_arg="-p $__port"
    fi

    # Prepare environment variables
    env_args=""
    if [ -n "$__env" ]; then
        for env_pair in $__env; do
            env_args="$env_args -e $env_pair"
        done
    fi

    # Prepare custom command
    cmd_arg=""
    if [ -n "$__cmd" ]; then
        cmd_arg="$__cmd"
    fi

    # Prepare mount host volume
    mount_args=""
    if [ -n "$__mount" ]; then
        for mount_pair in $__mount; do
            mount_args="$mount_args -v $mount_pair"
        done
    fi

    docker_cmd="docker run --init -d \
                --name $container_name \
                --network soai-net \
                $port_arg \
                $env_args \
                $mount_args \
                $full_image \
                $cmd_arg"

    echo ">> $docker_cmd"
    eval $docker_cmd || die "Failed to run container $container_name"
}

## run_public_image
## Run a docker container from public image
## Sets container name: soai_<module>
##
## --name=<module name>
## --port=<host:container>  (optional)
## --env="KEY=VALUE ... KEY2=VAL" (optional)
## --cmd="<cmd to run inside container>" (optional)
##
run_public_image() {
    test -n "$__name" || die "Module name required"
    test -n "$__image" || __image="$__name"
    container_name="soai_$__name"

    echo "Running public container: $container_name from image: $__image"
    ensure_network

    # Stop & remove existing container if exists
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${container_name}$"; then
        echo "Container already exists. Removing..."
        docker rm -f "$container_name"
    fi

    # Prepare port mapping
    port_args=""
    if [ -n "$__port" ]; then
        port_args="-p $__port"
    fi

    # Prepare environment variables
    env_args=""
    if [ -n "$__env" ]; then
        for env_pair in $__env; do
            env_args="$env_args -e $env_pair"
        done
    fi

    # Prepare custom command
    cmd_args=""
    if [ -n "$__cmd" ]; then
        cmd_args="$__cmd"
    fi

    # Prepare mount host volume
    mount_args=""
    if [ -n "$__mount" ]; then
        for mount_pair in $__mount; do
            mount_args="$mount_args -v $mount_pair"
        done
    fi

    # Compose final docker run command
    docker_cmd="docker run --init -d \
        --name $container_name \
        --network soai-net \
        $port_args \
        $env_args \
        $mount_args \
        $__image \
        $cmd_args"

    echo ">> $docker_cmd"
    eval $docker_cmd || die "Failed to run public container $container_name"
}

## remove_image
## Remove docker containers and images by name if they exist
## Matches container name soai_<module>
## Matches image: $DOCKER_REGISTRY/soai-<module>:<version>
##
## --name=<module name>
##
remove_image() {
    test -n "$__name" || die "Module name required"
    image_name="soai-$__name"
    container_name="soai_$__name"
    version=$(get_version)

    full_image="$DOCKER_REGISTRY/$image_name:$version"

    echo "Removing container and image for module: $__name"
    echo "Target container: $container_name"
    echo "Target image: $full_image"

    # Remove container if exists
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${container_name}$"; then
        echo "Removing container: $container_name"
        docker rm -f "$container_name" || echo "Failed to remove container: $container_name"
    else
        echo "Container $container_name does not exist."
    fi

    # Remove image if exists
    if docker images -q "$full_image" | grep -q .; then
        echo "Removing image: $full_image"
        docker rmi -f "$full_image" || echo "Failed to remove image: $full_image"
    else
        echo "Image $full_image does not exist."
    fi
}

## remove_public_image
## Remove docker public containers and images by name if they exist
## Matches container name soai_<module>
##
## --name=<module_name>
##
remove_public_image() {
    test -n "$__name" || die "Module name required"
    test -n "$__image" || __image="$__name"
    container_name="soai_$__name"

    echo "Removing container and image for module: $__name"
    echo "Target container: $container_name"
    echo "Target image: $__image"

    # Remove container if exists
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${container_name}$"; then
        echo "Removing container: $container_name"
        docker rm -f "$container_name" || echo "Failed to remove container: $container_name"
    else
        echo "Container $container_name does not exist."
    fi

    # Remove image if exists
    if docker images -q "$__image" | grep -q .; then
        echo "Removing image: $__image"
        docker rmi -f "$__image" || echo "Failed to remove image: $__image"
    else
        echo "Image $__image does not exist."
    fi
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
