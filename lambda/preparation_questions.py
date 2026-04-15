from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
import uuid
from datetime import datetime
from botocore.config import Config

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ FORCE REGIONAL CONFIG TO PREVENT SIGNATURE ERRORS
my_config = Config(
    region_name='ap-south-1',
    signature_version='v4'
)

dynamodb = boto3.client("dynamodb", config=my_config)
TABLE_NAME = "prepQuestions"

def format_data(items):
    result = []
    for item in items:
        result.append({
            "id": item.get("id", {}).get("S"),
            "title": item.get("title", {}).get("S"),
            "description": item.get("description", {}).get("S"),
            "difficulty": item.get("difficulty", {}).get("S"),
            "company": item.get("company", {}).get("S"),
            "topic": item.get("topic", {}).get("S"),
            "role": item.get("role", {}).get("S"),
            "createdAt": item.get("createdAt", {}).get("S"),
        })
    return result

# =========================================================
# 🟢 CREATE QUESTION
# =========================================================
@app.route("/questions", methods=["POST"])
def add_question():
    data = request.json
    if not data.get("title") or not data.get("company") or not data.get("topic"):
        return jsonify({"error": "Missing required fields"}), 400

    question_id = str(uuid.uuid4())
    title = data["title"].strip()
    difficulty = data.get("difficulty", "MEDIUM").upper()
    company = data["company"].upper()
    topic = data["topic"].upper()
    role = data.get("role", "SDE1").upper()
    created_at = datetime.utcnow().strftime("%Y-%m-%d")

    # Mapping sort key
    sk_value = f"DIFF#{difficulty}#{created_at}"

    dynamodb.put_item(
        TableName=TABLE_NAME,
        Item={
            "pk": {"S": f"QUESTION#{question_id}"},
            "sk": {"S": "METADATA"},
            "id": {"S": question_id},
            "title": {"S": title},
            "description": {"S": data.get("description", "")},
            "difficulty": {"S": difficulty},
            "company": {"S": company},
            "topic": {"S": topic},
            "role": {"S": role},
            "createdAt": {"S": created_at},
            # ✅ FIX: Using lowercase 'pk' and 'sk' to match your GSI schema
            "GSI1pk": {"S": f"COMPANY#{company}"},
            "GSI1sk": {"S": sk_value},
            "GSI2pk": {"S": f"TOPIC#{topic}"},
            "GSI2sk": {"S": sk_value},
            "GSI3pk": {"S": f"ROLE#{role}"},
            "GSI3sk": {"S": sk_value},
            "GSI4pk": {"S": "ALL"},
            "GSI4sk": {"S": sk_value},
        }
    )
    return jsonify({"message": "Question created", "id": question_id})

# =========================================================
# 🟢 GET ALL QUESTIONS (GSI4)
# =========================================================
@app.route("/questions", methods=["GET"])
def get_questions():
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName="GSI4",
            KeyConditionExpression="GSI4pk = :pk", # ✅ Lowercase pk
            ExpressionAttributeValues={":pk": {"S": "ALL"}}
        )
        return jsonify(format_data(response.get("Items", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 🟢 GET BY COMPANY (GSI1)
# =========================================================
@app.route("/questions/company/<company>", methods=["GET"])
def get_by_company(company):
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName="GSI1",
            KeyConditionExpression="GSI1pk = :pk", # ✅ Lowercase pk
            ExpressionAttributeValues={":pk": {"S": f"COMPANY#{company.upper()}"}}
        )
        return jsonify(format_data(response.get("Items", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 🟢 GET BY TOPIC (GSI2)
# =========================================================
@app.route("/questions/topic/<topic>", methods=["GET"])
def get_by_topic(topic):
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName="GSI2",
            KeyConditionExpression="GSI2pk = :pk", # ✅ Lowercase pk
            ExpressionAttributeValues={":pk": {"S": f"TOPIC#{topic.upper()}"}}
        )
        return jsonify(format_data(response.get("Items", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 🟢 GET BY ROLE (GSI3)
# =========================================================
@app.route("/questions/role/<role>", methods=["GET"])
def get_by_role(role):
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName="GSI3",
            KeyConditionExpression="GSI3pk = :pk", # ✅ Lowercase pk
            ExpressionAttributeValues={":pk": {"S": f"ROLE#{role.upper()}"}}
        )
        return jsonify(format_data(response.get("Items", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 🟢 DELETE
# =========================================================
@app.route("/questions/<qid>", methods=["DELETE"])
def delete_question(qid):
    try:
        dynamodb.delete_item(
            TableName=TABLE_NAME,
            Key={
                "pk": {"S": f"QUESTION#{qid}"},
                "sk": {"S": "METADATA"}
            }
        )
        return jsonify({"message": "Deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 🟡 UPDATE (FIXED SYNC)
# =========================================================
@app.route("/questions/<qid>", methods=["PUT"])
def update_question(qid):
    try:
        data = request.json
        update_expr = []
        expr_values = {}
        now = datetime.utcnow().strftime('%Y-%m-%d')

        if "title" in data:
            update_expr.append("title = :t")
            expr_values[":t"] = {"S": data["title"]}

        # If difficulty changes, we MUST update ALL GSI SKs
        if "difficulty" in data:
            diff = data["difficulty"].upper()
            sk_val = f"DIFF#{diff}#{now}"
            update_expr.extend(["difficulty = :diff", "GSI1sk = :sv", "GSI2sk = :sv", "GSI3sk = :sv", "GSI4sk = :sv"])
            expr_values[":diff"] = {"S": diff}
            expr_values[":sv"] = {"S": sk_val}

        if "company" in data:
            comp = data["company"].upper()
            update_expr.extend(["company = :c", "GSI1pk = :g1p"])
            expr_values[":c"] = {"S": comp}
            expr_values[":g1p"] = {"S": f"COMPANY#{comp}"}

        if "topic" in data:
            tpc = data["topic"].upper()
            update_expr.extend(["topic = :tpc", "GSI2pk = :g2p"])
            expr_values[":tpc"] = {"S": tpc}
            expr_values[":g2p"] = {"S": f"TOPIC#{tpc}"}

        if "role" in data:
            role = data["role"].upper()
            update_expr.extend(["role = :r", "GSI3pk = :g3p"])
            expr_values[":r"] = {"S": role}
            expr_values[":g3p"] = {"S": f"ROLE#{role}"}

        if not update_expr:
            return jsonify({"error": "No fields to update"}), 400

        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={"pk": {"S": f"QUESTION#{qid}"}, "sk": {"S": "METADATA"}},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_values
        )
        return jsonify({"message": "Question updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)