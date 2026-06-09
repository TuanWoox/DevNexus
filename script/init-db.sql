SELECT 'CREATE DATABASE platform_core_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'platform_core_db')\gexec

SELECT 'CREATE DATABASE devnexus_background_job'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'devnexus_background_job')\gexec

SELECT 'CREATE DATABASE devnexus_message'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'devnexus_message')\gexec

SELECT 'CREATE DATABASE ai_worker_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_worker_db')\gexec

SELECT 'CREATE DATABASE devnexus_notification'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'devnexus_notification')\gexec
