package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run a.go <mongoURI>")
		fmt.Println("Example: go run a.go mongodb://localhost:27017/mona360")
		return
	}
	mongoURI := os.Args[1]

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Connect to MongoDB
	fmt.Println("Connecting to MongoDB...")
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(context.Background())

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}
	fmt.Println("✓ Connected successfully")

	// Create dB directory if it doesn't exist
	dbDir := "dB"
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatal("Failed to create dB directory:", err)
	}

	// Extract database name from URI or use default
	dbName := "mona360"
	db := client.Database(dbName)

	// List all collections
	collections, err := db.ListCollectionNames(context.Background(), bson.D{})
	if err != nil {
		log.Fatal("Failed to list collections:", err)
	}
	if len(collections) == 0 {
		log.Fatal("No collections found in database")
	}

	fmt.Printf("\nFound %d collections in database '%s'\n", len(collections), dbName)

	totalExported := 0
	successCount := 0

	// Export each collection to JSON
	for i, collectionName := range collections {
		fmt.Printf("\n[%d/%d] Exporting: %s\n", i+1, len(collections), collectionName)

		coll := db.Collection(collectionName)

		cursor, err := coll.Find(context.Background(), bson.D{})
		if err != nil {
			log.Printf("✗ Failed to read documents: %v\n", err)
			continue
		}

		var docs []bson.M
		if err = cursor.All(context.Background(), &docs); err != nil {
			log.Printf("✗ Failed to decode documents: %v\n", err)
			cursor.Close(context.Background())
			continue
		}
		cursor.Close(context.Background())

		if len(docs) == 0 {
			fmt.Printf("  ⚠ Collection is empty\n")
			continue
		}

		// Write to JSON file
		filename := filepath.Join(dbDir, fmt.Sprintf("%s.json", collectionName))
		file, err := os.Create(filename)
		if err != nil {
			log.Printf("✗ Failed to create file: %v\n", err)
			continue
		}

		encoder := json.NewEncoder(file)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(docs); err != nil {
			log.Printf("✗ Failed to write JSON: %v\n", err)
			file.Close()
			continue
		}
		file.Close()

		fmt.Printf("  ✓ Exported %d documents → %s\n", len(docs), filename)
		totalExported += len(docs)
		successCount++
	}

	// Summary
	fmt.Printf("Export Complete!\n")
	fmt.Printf("Collections exported: %d/%d\n", successCount, len(collections))
	fmt.Printf("Total documents: %d\n", totalExported)
	fmt.Printf("Output directory: %s/\n", dbDir)
}