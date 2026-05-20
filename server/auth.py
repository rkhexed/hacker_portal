import os
from functools import wraps
from flask import request, jsonify, g
import jwt
import logging

logger = logging.getLogger(__name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Token format is invalid'}), 401
        
        # If the token is missing, return an error
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            jwt_secret = os.environ.get('SUPABASE_JWT_SECRET')
            if not jwt_secret:
                return jsonify({'message': 'Server configuration error: JWT secret not set'}), 500
            
            # Decode without verification first to check the token structure
            # Note: Supabase uses HS256 algorithm and requires audience verification
            data = jwt.decode(
                token, 
                jwt_secret, 
                algorithms=['HS256'],
                audience='authenticated',
                options={
                    'require': ['exp', 'iat', 'sub'],
                    'verify_exp': True,
                    'verify_iat': True
                }
            )
            # You can optionally pass the user data to the route
            g.token_user = data
        except jwt.ExpiredSignatureError:
            logger.warning("Rejected expired JWT")
            return jsonify({'message': 'Token has expired'}), 401

        except jwt.InvalidAudienceError:
            logger.warning("Rejected JWT with invalid audience")
            return jsonify({'message': 'Token is invalid'}), 401  

        except jwt.MissingRequiredClaimError as e:
            logger.warning(f"JWT missing required claim: {e.claim}")
            return jsonify({'message': 'Token is invalid'}), 401

        except jwt.InvalidTokenError:
            logger.warning("Rejected invalid JWT", exc_info=True)
            return jsonify({'message': 'Token is invalid'}), 401  

        except Exception:
            logger.exception("Unexpected error during JWT validation")
            return jsonify({'message': 'Internal server error'}), 500
        

        return f(*args, **kwargs)

    return decorated
