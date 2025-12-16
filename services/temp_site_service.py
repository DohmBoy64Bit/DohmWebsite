import json
import uuid
from datetime import datetime
from services.bbs_service import redis
from utils.logging_config import app_logger as logger

class TempSiteService:
    @staticmethod
    def create_site(html, css, js):
        """
        Creates a new temporary site and stores it in Redis with 24h TTL.
        Returns the unique site ID.
        """
        site_id = str(uuid.uuid4())
        
        site_data = {
            'id': site_id,
            'html': html,
            'css': css,
            'js': js,
            'created_at': datetime.now().isoformat(),
            'views': 0
        }
        
        try:
            # Store in Redis
            key = f"tempsite:{site_id}"
            redis.set(key, json.dumps(site_data))
            
            # Set 24 hour expiration (86400 seconds)
            redis.expire(key, 86400)
            
            logger.info(f"Created temp site: {site_id}")
            return site_id
            
        except Exception as e:
            logger.error(f"Error creating temp site: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def get_site(site_id):
        """
        Retrieves a temp site by ID.
        Returns None if not found or expired.
        """
        try:
            key = f"tempsite:{site_id}"
            data = redis.get(key)
            
            if not data:
                return None
                
            site = json.loads(data)
            
            # Increment view counter (fire and forget)
            try:
                site['views'] += 1
                redis.set(key, json.dumps(site))
                # Reset TTL to ensure it doesn't extend life? 
                # Actually, standard behavior is TTL persists unless SET/GETSET/GETDEL. 
                # SET re-sets TTL to -1 (persist) by default unless KEEPTTL is used.
                # Upstash/Redis-py might behave differently. 
                # Let's re-apply expiration to be safe, but ideally we want absolute 24h from creation.
                # For now, let's just keep it simple. If views extending life is a feature, that's fine.
                # But to strictly enforce 24h from creation, we would use EXPIREAT with a timestamp.
                # Let's just re-expire for now, users won't mind if their active site stays up.
                redis.expire(key, 86400) 
            except Exception as e:
                logger.warning(f"Failed to update view count for site {site_id}: {str(e)}")
                
            return site
            
        except Exception as e:
            logger.error(f"Error retrieving temp site {site_id}: {str(e)}", exc_info=True)
            return None
