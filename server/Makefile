postgresinit:
	docker run -d \
		--name postgres \
		-p 5432:5432 \
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
# 	migrate -path ./db/migrations -database "postgresql://root:password@localhost:5432/go-chat?sslmode=disable" -verbose up
	migrate -path ./db/migrations -database "postgresql://postgres:%40252302Yogesh@localhost:5432/go-chat?sslmode=disable" -verbose up

migratedown:
	migrate -path ./db/touch Makefilemigrations -database "postgresql://root:password@localhost:5432/go-chat?sslmode=disable" -verbose down


.PHONY: postgresinit postgres postgresstop postgresrm dropdb migrateup migratedown