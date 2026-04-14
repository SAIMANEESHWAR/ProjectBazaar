from flask import Flask, jsonify
from flask_cors import CORS
import boto3
from flask import Flask, jsonify
from flask_cors import CORS
import boto3

app = Flask(__name__)
CORS(app)

# ✅ DynamoDB client (FIXED region)
client = boto3.client("dynamodb", region_name="ap-south-2")

# ✅ Convert DynamoDB format → normal JSON
def format_data(items):
    return [
        {
            "id": item.get("id", {}).get("S"),
            "title": item.get("title", {}).get("S"),
            "difficulty": item.get("difficulty", {}).get("S"),
            "company": item.get("company", {}).get("S"),
            "role": item.get("role", {}).get("S"),
        }
        for item in items
    ]

# ✅ Get all questions
@app.route("/questions", methods=["GET"])
def get_questions():
    response = client.query(
        TableName="prepQuestions",
        IndexName="GSI4",
        KeyConditionExpression="GSI4PK = :pk",
        ExpressionAttributeValues={
            ":pk": {"S": "ALL"}
        }
    )
    return jsonify(format_data(response.get("Items", [])))

# ✅ Filter by company
@app.route("/questions/company/<company>", methods=["GET"])
def get_by_company(company):
    response = client.query(
        TableName="perpQuestions",
        IndexName="GSI1",
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={
            ":pk": {"S": f"COMPANY#{company.upper()}"}
        }
    )
    return jsonify(format_data(response.get("Items", [])))

# ✅ Run server
app.run(port=5000)
app = Flask(__name__)
CORS(app)

# ✅ DynamoDB client
dynamodb = boto3.client("dynamodb", region_name="ap-south-2")

# ✅ Helper to convert DynamoDB format → normal JSON
def format_data(items):
    result = []
    for item in items:
        result.append({
            "id": item.get("id", {}).get("S"),
            "title": item.get("title", {}).get("S"),
            "difficulty": item.get("difficulty", {}).get("S"),
            "company": item.get("company", {}).get("S"),
            "role": item.get("role", {}).get("S")
        })
    return result


# ✅ Get all questions
@app.route("/questions", methods=["GET"])
def get_questions():
    response = dynamodb.query(
        TableName="perpQuestions",
        IndexName="GSI4",
        KeyConditionExpression="GSI4PK = :pk",
        ExpressionAttributeValues={
            ":pk": {"S": "ALL"}
        }
    )

    data = format_data(response.get("Items", []))
    return jsonify(data)


# ✅ Filter by company (optional)
@app.route("/questions/company/<company>", methods=["GET"])
def get_by_company(company):
    response = dynamodb.query(
        TableName="perpQuestions",
        IndexName="GSI1",
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={
            ":pk": {"S": f"COMPANY#{company.upper()}"}
        }
    )

    data = format_data(response.get("Items", []))
    return jsonify(data)


if __name__ == "__main__":
    app.run(port=5000, debug=True)