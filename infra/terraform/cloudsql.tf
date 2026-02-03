# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "main" {
  name             = "ufc-elo-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled = true
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled = true
      # Allow Cloud Run to connect
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0"
      }
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false  # Set to true for production

  depends_on = [google_project_service.apis]
}

# Database
resource "google_sql_database" "main" {
  name     = "ufc_elo"
  instance = google_sql_database_instance.main.name
}

# Database user
resource "google_sql_user" "main" {
  name     = "ufc_elo"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Output connection string
output "database_connection" {
  value     = "postgresql://${google_sql_user.main.name}:${var.db_password}@${google_sql_database_instance.main.public_ip_address}:5432/${google_sql_database.main.name}"
  sensitive = true
}

output "database_host" {
  value = google_sql_database_instance.main.public_ip_address
}
