import boto3
import zipfile
import io
import os

lambda_client = boto3.client('lambda', region_name='ap-south-2')

def deploy_function(function_name, py_file_path):
    # Zip the file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(py_file_path, arcname=os.path.basename(py_file_path))
    
    zip_bytes = zip_buffer.getvalue()
    
    # Update Lambda
    print(f"Deploying {function_name}...")
    try:
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_bytes
        )
        print(f"Success! New Version: {response['Version']}")
    except Exception as e:
        print(f"Failed to deploy {function_name}: {e}")

if __name__ == "__main__":
    deploy_function("prep_admin_handler", "lambda/prep_admin_handler.py")
    deploy_function("prep_user_handler", "lambda/prep_user_handler.py")
