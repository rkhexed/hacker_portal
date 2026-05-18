from flask import Flask, jsonify, request, g
from flask_cors import CORS
from supabase_client import supabase
from auth import token_required

app = Flask(__name__)
CORS(app)

@app.route("/api/hello", methods=["GET"])
def hello_world():
    return jsonify({"message": "Hello from Python Backend!"})


#helper to get thru THIS SLOP
def get_current_user_id():
    email = g.token_user.get("email")
    res = supabase.table("users").select("id").eq("email", email).single().execute()
    return res.data["id"] if res.data else None


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
@app.route("/api/user", methods=["POST"])
@token_required
def create_user():
    """Create a new user record without status (user hasn't applied yet)"""
    try:
        data = request.get_json()
        email = data.get("email")
        name = data.get("name")
        user_id = data.get("id")
        
        if not email or not name or not user_id:
            return jsonify({"error": "Email, name, and id are required"}), 400
        
        # Check if user already exists
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({"user": existing.data[0]}), 200
        
        # Create new user without status (null) - they haven't applied yet
        response = supabase.table("users").insert({
            "id": user_id,
            "email": email,
            "name": name,
            "status": None  # No status until they submit application
        }).execute()
        
        return jsonify({"user": response.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>", methods=["GET"])
@token_required
def get_user(user_id):
    """Get user details by ID"""
    if get_current_user_id() != user_id:
        return jsonify({"error": "Unauthorized access to user data"}), 403  
    try:
        response = supabase.table("users").select("*, teams(*)").eq("id", user_id).single().execute()
        return jsonify({"user": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>", methods=["PUT"])
@token_required
def update_user(user_id):
    """Update user profile"""
    if get_current_user_id() != user_id:
        return jsonify({"error": "Unauthorized access to user data"}), 403
    
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
@token_required
def get_user_by_email(email):
    """Get user details by email (includes status)"""
    if g.token_user.get("email") != email:
        return jsonify({"error": "Unauthorized access to user data"}), 403
    try:
        response = supabase.table("users").select("*, teams(*)").eq("email", email).single().execute()
        return jsonify({"user": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>/points", methods=["POST"])
# Removed token_required for testing purposes, can add back later
# @token_required
def add_points(user_id):
    """Add points to a user"""
    if get_current_user_id() != user_id:
        return jsonify({"error": "Unauthorized access to user data"}), 403
    try:
        data = request.get_json()
        points_to_add = data.get("user_interaction_points", 0)
        
        # Get current points
        user_response = supabase.table("users").select("user_interaction_points").eq("id", user_id).single().execute()
        current_points = user_response.data.get("user_interaction_points", 0) or 0
        
        # Update with new points
        new_points = current_points + points_to_add
        response = supabase.table("users").update({"user_interaction_points": new_points}).eq("id", user_id).execute()
        
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
@token_required
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
@token_required
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
    if get_current_user_id() != user_id:
        return jsonify({"error": "Unauthorized access to user data"}), 403
    try:
        response = supabase.table("checkins").select("*, events(*)").eq("user_id", user_id).execute()
        return jsonify({"checkins": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/checkin", methods=["POST"])
@token_required
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

# ==================== APPLICATION QUESTIONS ====================
@app.route("/api/application-questions", methods=["GET"])
def get_application_questions():
    """Get all application questions ordered by sort_order"""
    try:
        response = supabase.table("application_questions").select("*").order("sort_order").execute()
        return jsonify({"questions": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/application/submit", methods=["POST"])
@token_required
def submit_application():
    """Submit application with answers and update user status"""
    try:
        data = request.get_json()
        email = data.get("email")
        name = data.get("name")
        answers = data.get("answers", {})
        
        if not email or not name:
            return jsonify({"error": "Email and name are required"}), 400
        
        # Fetch all questions to get field_key mappings
        questions_response = supabase.table("application_questions").select("id, field_key").execute()
        question_map = {q["id"]: q["field_key"] for q in questions_response.data}
        
        # Create application record
        app_response = supabase.table("applications").insert({
            "email": email,
            "name": name,
            "status": "pending"
        }).execute()
        
        if not app_response.data or len(app_response.data) == 0:
            return jsonify({"error": "Failed to create application"}), 500
        
        application_id = app_response.data[0]["id"]
        
        # Create answer records and collect profile field mappings
        answer_records = []
        profile_updates = {}
        
        for question_id, answer_text in answers.items():
            answer_records.append({
                "application_id": application_id,
                "question_id": question_id,
                "answer_text": answer_text
            })
            
            # If this question has a field_key, map it to user profile
            field_key = question_map.get(question_id)
            if field_key:
                profile_updates[field_key] = answer_text
        
        if answer_records:
            supabase.table("application_answers").insert(answer_records).execute()
        
        # Update user status and profile fields in users table
        user_update = {"status": "pending"}
        user_update.update(profile_updates)
        
        supabase.table("users").update(user_update).eq("email", email).execute()
        
        return jsonify({"application": app_response.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ==================== SCAN ====================
@app.route("/api/scan/<scanner_id>", methods=["POST"])
def submit_hacker_to_hacker_scan(scanner_id):
    """Submit table entry for a hacker to scan the qr code of another hacker with answers and update user status"""
    try:
        data = request.get_json()
        original_user_id = data.get("original_user_id")
        
        if not original_user_id or not scanner_id:
            return jsonify({"error": "Original user ID and scanner ID are required"}), 400
        
        # Create hacker to hacker scan record
        app_response = supabase.table("hacker_to_hacker_scans").insert({
            "original_user_id": original_user_id,
            "scanner_id": scanner_id,
        }).execute()
        
        if not app_response.data or len(app_response.data) == 0:
            return jsonify({"error": "Failed to create hacker to hacker scan record"}), 500

        # Get scanner's name for success message
        scanner = supabase.table("users").select("name").eq("id", scanner_id).single().execute()
        user_name = scanner.data.get("name", "User") if scanner.data else "User"

        return jsonify({
            "success": True,
            "userName": user_name,
            "scan": app_response.data[0]
        }), 201
    except Exception as e:
        # Handle unique constraint violation
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return jsonify({"error": "You have already scanned this user"}), 409
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8080)
