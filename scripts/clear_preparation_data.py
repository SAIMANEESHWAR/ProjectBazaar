import json
import urllib.request
import urllib.error
import sys

# The API Gateway Endpoint for Placement Preparation
# Replace this with your actual API Gateway URL if different
API_ENDPOINT = "https://8t6a3n0dti.execute-api.ap-south-2.amazonaws.com/default/placement_prep_handler"

def clear_data_via_api():
    print(f"Fetching all placement prep topics from: {API_ENDPOINT}")
    
    try:
        # Step 1: List all existing topics
        req = urllib.request.Request(
            API_ENDPOINT,
            data=json.dumps({"action": "list"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            
            if not res_body.get("success"):
                print(f"Error fetching topics: {res_body.get('message')}")
                sys.exit(1)
                
            phases = res_body.get("phases", [])
            topics = res_body.get("topics", phases) # Handle both "topics" and "phases" keys just in case
            
            if not topics:
                print("No topics found. The database is already empty.")
                return
                
            print(f"Found {len(topics)} topics to delete.")
            
        # Step 2: Delete each topic one by one
        # Alternatively, we could send an empty list to 'put' action as bulk delete,
        # but the safest way per the documented API is calling 'delete' for each ID
        # or sending "put" with an empty list `[]` to bulk replace to empty list.
        # According to documentation, "Topics not in the list will be deleted from the database"
        
        print("Executing bulk delete by sending an empty list of topics...")
        bulk_update_req = urllib.request.Request(
            API_ENDPOINT,
            data=json.dumps({
                "action": "put",
                "phases": [] # Use "phases" array since the handler expects "phases" in bulk_put
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(bulk_update_req) as del_response:
            del_res_body = json.loads(del_response.read().decode("utf-8"))
            
            if del_res_body.get("success"):
                print(f"Successfully cleared all placement preparation records!")
            else:
                print(f"Failed to clear data: {del_res_body.get('message', 'Unknown error')}")
                
    except urllib.error.URLError as e:
        print(f"HTTP Error occurred: {e.reason}")
        if hasattr(e, 'read'):
            print(e.read().decode("utf-8"))
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print(f"WARNING: This will delete ALL data in the PlacementPrep database via the API.")
    confirm = input("Are you sure you want to proceed? (yes/no): ")
    if confirm.lower() == 'yes':
        # Replace the placeholder URL with your actual URL if you haven't already
        # Example: API_ENDPOINT = "https://your-api-url.execute-api.ap-south-2.amazonaws.com/default/placement_prep_handler"
        if "YOUR_API_GATEWAY_URL" in API_ENDPOINT:
             print("Please replace YOUR_API_GATEWAY_URL with your actual API endpoint in the script first.")
             API_ENDPOINT = input("Enter your API Gateway URL: ")
             
        clear_data_via_api()
    else:
        print("Operation cancelled.")
