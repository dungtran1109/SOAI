import os
import platform
import psutil
import GPUtil


def clean_persistent_storage(directory):
    """A func that cleans all persist db files"""
    if os.path.exists(directory):
        for file in os.listdir(directory):
            if os.path.isfile(os.path.join(directory, file)):
                os.remove(os.path.join(directory, file))


def list_file_names(directory):
    """A func that list all the files in the dir"""
    if os.path.exists(directory):
        file_names = os.listdir(directory)
        file_names = [
            f for f in file_names if os.path.isfile(os.path.join(directory, f))
        ]

        return file_names
    return []


def create_source_dir(directory):
    """A func that creates non-exist dir"""
    if not os.path.exists(directory):
        os.makedirs(directory)


def list_file_paths(directory):
    """A func lists all the file in a path"""
    filepaths = []
    if os.path.exists(directory):
        for root, _, files in os.walk(directory):
            for filename in files:
                filepath = os.path.join(root, filename)
                filepaths.append(filepath)
    return filepaths


def get_cpu_info():
    name = platform.processor()
    core = psutil.cpu_count(logical=False)
    freq = psutil.cpu_freq().max
    return f"{name}-{core}-{freq/1000}GHz"


def get_size(bytes, suffix="B"):
    """
    Scale bytes to its proper format
    e.g:
        1253656 => '1.20MB'
        1253656678 => '1.17GB'
    """
    factor = 1024
    for unit in ["", "K", "M", "G", "T", "P"]:
        if bytes < factor:
            return f"{bytes:.2f}{unit}{suffix}"
        bytes /= factor


def get_memory():
    svmem = psutil.virtual_memory()
    return get_size(svmem.total)


def get_gpu():
    gpus = GPUtil.getGPUs()
    cpu_info = ""
    for gpu in gpus:
        name = gpu.name
        memory = gpu.memoryTotal
        cpu_info = f"{name}-{memory}MB"
    return cpu_info


print(get_memory())
