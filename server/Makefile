postgresinit:
	docker run -d \
		--name postgres \
		-p 5431:5432 \
		-e POSTGRES_USER=root \
		-e POSTGRES_PASSWORD=password \
		postgres

postgres:
	docker exec -it postgres psql -U root

postgresstop:
	docker stop postgres

postgresrm:
	docker rm postgres

dropdb:
	docker exec -it postgres psql -U root -c "DROP DATABASE IF EXISTS postgres;"

migrateup:
	migrate -path ./migrations -database "postgresql://root:password@localhost:5431/go-chat?sslmode=disable" -verbose up 
# 	migrate -path ./migrations -database "postgresql://neondb_owner:npg_nWyzT6EVF1gd@ep-calm-wind-b53miamb-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -verbose up 

migratedown:
	migrate -path ./migrations -database "postgresql://root:password@localhost:5431/go-chat?sslmode=disable" -verbose down
# 	migrate -path ./migrations -database "postgresql://postgres:%40252302Yogesh@localhost:5432/go-chat?sslmode=disable" -verbose down


.PHONY: postgresinit postgres postgresstop postgresrm dropdb migrateup migratedown