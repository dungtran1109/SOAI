# FastAPI Service Utility Scripts

This project provides utility scripts for managing FastAPI services efficiently.

## Generating FastAPI Service Structure
To create the structure for a new FastAPI service, use the following command:

```bash
./gen_service.sh <service_name>
```

Replace `<service_name>` with the desired name of your service.

## Removing `__pycache__` Directories
To clean up all `__pycache__` directories in the project (e.g., before submitting or sharing your project), use this command:

```bash
./clean_pycache.sh
```

This will recursively find and remove all `__pycache__` directories in the project.

---

