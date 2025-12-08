package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run a.go <fromMongoURI> <toMongoURI>")
		return
	}
	fromURI := os.Args[1]
	toURI := os.Args[2]

	ctx := context.Background()

	// Connect to source MongoDB
	fromClient, err := mongo.Connect(ctx, options.Client().ApplyURI(fromURI))
	if err != nil {
		log.Fatal("Failed to connect to source:", err)
	}
	defer fromClient.Disconnect(ctx)

	// Connect to destination MongoDB
	toClient, err := mongo.Connect(ctx, options.Client().ApplyURI(toURI))
	if err != nil {
		log.Fatal("Failed to connect to destination:", err)
	}
	defer toClient.Disconnect(ctx)

	// List collections in source DB
	dbName := "mona360"
	fromDB := fromClient.Database(dbName)
	toDB := toClient.Database(dbName)

	collections, err := fromDB.ListCollectionNames(ctx, bson.D{})
	if err != nil {
		log.Fatal("Failed to list collections:", err)
	}
	if len(collections) == 0 {
		log.Fatal("No collections found in source DB")
	}

	fmt.Printf("Found %d collections to export\n", len(collections))

	totalExported := 0

	// Export all collections
	for _, collectionName := range collections {
		fmt.Printf("\n--- Exporting collection: %s ---\n", collectionName)

		fromColl := fromDB.Collection(collectionName)
		toColl := toDB.Collection(collectionName)

		cursor, err := fromColl.Find(ctx, bson.D{})
		if err != nil {
			log.Printf("Failed to read documents from %s: %v\n", collectionName, err)
			continue
		}
		defer cursor.Close(ctx)

		var docs []interface{}
		if err = cursor.All(ctx, &docs); err != nil {
			log.Printf("Failed to decode documents from %s: %v\n", collectionName, err)
			continue
		}

		if len(docs) > 0 {
			// Use ordered: false to skip duplicates and continue inserting other documents
			opts := options.InsertMany().SetOrdered(false)
			result, err := toColl.InsertMany(ctx, docs, opts)
			if err != nil {
				// Log the error but continue
				fmt.Printf("Warning: Some documents failed to insert in %s: %v\n", collectionName, err)
				fmt.Printf("Successfully inserted %d documents\n", len(result.InsertedIDs))
				totalExported += len(result.InsertedIDs)
			} else {
				fmt.Printf("✓ Exported %d documents from %s\n", len(docs), collectionName)
				totalExported += len(docs)
			}
		} else {
			fmt.Printf("No documents found in %s\n", collectionName)
		}
	}

	fmt.Printf("\n=== Export Complete ===\n")
	fmt.Printf("Total documents exported: %d\n", totalExported)
}