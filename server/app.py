from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase_client import supabase

app = Flask(__name__)
CORS(app)

@app.route("/api/hello", methods=["GET"])
def hello_world():
    return jsonify({"message": "Hello from Python Backend!"})

# ==================== EVENTS / SCHEDULE ====================
@app.route("/api/events", methods=["GET"])
def get_events():
    """Get all events for the schedule"""
    try:
        response = supabase.table("events").select("*").order("starts_at").execute()
        return jsonify({"events": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== USER ====================
@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get user details by ID"""
    try:
        response = supabase.table("users").select("*, teams(*)").eq("id", user_id).single().execute()
        return jsonify({"user": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        # Only allow updating certain fields
        allowed_fields = ['name', 'school', 'year', 'dietary', 'tshirt_size', 'github', 'linkedin', 'portfolio']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        response = supabase.table("users").update(update_data).eq("id", user_id).execute()
        return jsonify({"user": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/email/<email>", methods=["GET"])
def get_user_by_email(email):
    """Get user details by email (includes status)"""
    try:
        response = supabase.table("users").select("*, teams(*)").eq("email", email).single().execute()
        return jsonify({"user": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>/points", methods=["POST"])
def add_points(user_id):
    """Add points to a user"""
    try:
        data = request.get_json()
        points_to_add = data.get("points", 0)
        
        # Get current points
        user_response = supabase.table("users").select("points").eq("id", user_id).single().execute()
        current_points = user_response.data.get("points", 0) or 0
        
        # Update with new points
        new_points = current_points + points_to_add
        response = supabase.table("users").update({"points": new_points}).eq("id", user_id).execute()
        
        return jsonify({"points": new_points, "added": points_to_add})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== TEAMS ====================
@app.route("/api/teams", methods=["GET"])
def get_teams():
    """Get all teams"""
    try:
        response = supabase.table("teams").select("*").execute()
        return jsonify({"teams": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/teams", methods=["POST"])
def create_team():
    """Create a new team and add creator as member"""
    try:
        data = request.get_json()
        team_name = data.get("name")
        looking_for = data.get("looking_for", "")
        has_space = data.get("has_space", True)
        creator_email = data.get("creator_email")
        
        if not team_name:
            return jsonify({"error": "Team name is required"}), 400
        
        # Create the team
        team_response = supabase.table("teams").insert({
            "name": team_name,
            "looking_for": looking_for,
            "has_space": has_space
        }).execute()
        
        if team_response.data and len(team_response.data) > 0:
            team_id = team_response.data[0]["id"]
            
            # Add creator to the team if email provided
            if creator_email:
                supabase.table("users").update({
                    "team_id": team_id
                }).eq("email", creator_email).execute()
            
            return jsonify({"team": team_response.data[0]})
        else:
            return jsonify({"error": "Failed to create team"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/teams/available", methods=["GET"])
def get_available_teams():
    """Get teams that have space for new members"""
    try:
        response = supabase.table("teams").select("*, users(id, name, email)").eq("has_space", True).execute()
        return jsonify({"teams": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team/<team_id>", methods=["GET"])
def get_team(team_id):
    """Get team details with members"""
    try:
        response = supabase.table("teams").select("*, users(*)").eq("id", team_id).single().execute()
        return jsonify({"team": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team/<team_id>", methods=["PUT"])
def update_team(team_id):
    """Update team details"""
    try:
        data = request.get_json()
        # Only allow updating certain fields
        allowed_fields = ['name', 'looking_for', 'has_space']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        response = supabase.table("teams").update(update_data).eq("id", team_id).execute()
        return jsonify({"team": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== ANNOUNCEMENTS ====================
@app.route("/api/announcements", methods=["GET"])
def get_announcements():
    """Get all announcements"""
    try:
        response = supabase.table("announcements").select("*, users(name)").order("created_at", desc=True).execute()
        return jsonify({"announcements": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== CHECK-INS ====================
@app.route("/api/checkins/<user_id>", methods=["GET"])
def get_user_checkins(user_id):
    """Get all check-ins for a user"""
    try:
        response = supabase.table("checkins").select("*, events(*)").eq("user_id", user_id).execute()
        return jsonify({"checkins": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/checkin", methods=["POST"])
def create_checkin():
    """Create a check-in for an event"""
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        event_id = data.get("event_id")
        user_name = data.get("user_name", "")
        
        response = supabase.table("checkins").insert({
            "user_id": user_id,
            "event_id": event_id,
            "user_name": user_name
        }).execute()
        return jsonify({"checkin": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== APPLICATION STATUS ====================
@app.route("/api/application/<email>", methods=["GET"])
def get_application_status(email):
    """Get application status by email"""
    try:
        response = supabase.table("applications").select("id, email, name, status, created_at").eq("email", email).single().execute()
        return jsonify({"application": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8080)
