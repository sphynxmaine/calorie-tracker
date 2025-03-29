# Firebase Index Setup Instructions

## Understanding Firebase Indexes

When you encounter an error like this in your application:
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

This means Firebase needs an index to efficiently execute your query. Firestore requires composite indexes for queries that:
- Use multiple field filters
- Use a combination of filters and ordering
- Order by fields not included in filters

## Method 1: Using the Error Links (Easiest Method)

The simplest way to create required indexes is to:

1. Click on the link in the error message
2. Sign in to your Firebase console if prompted
3. Click "Create Index" button
4. Wait for the index to be created (may take a few minutes)

Here are some common indexes needed for this application:

### foodEntries Collection Index
```
https://console.firebase.google.com/project/_/firestore/indexes?create_composite=ClBwcm9qZWN0cy9jYWxvcmllLXRyYWNrZXIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2Zvb2RFbnRyaWVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWRhdGVJbk1pbHMQARoMCghkZWxldGVkEAEaDAoIX19uYW1lX18QAQ
```

### weightLogs Collection Index
```
https://console.firebase.google.com/project/_/firestore/indexes?create_composite=ClBwcm9qZWN0cy9jYWxvcmllLXRyYWNrZXIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3dlaWdodExvZ3MvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDgoKZGF0ZUZvcm1hdBABGgwKCGRlbGV0ZWQQARoMCghfX25hbWVfXxAB
```

### userFoods Collection Index
```
https://console.firebase.google.com/project/_/firestore/indexes?create_composite=ClBwcm9qZWN0cy9jYWxvcmllLXRyYWNrZXIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3VzZXJGb29kcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoMCghuYW1lTG93EAEaDAoIX19uYW1lX18QAQ
```

## Method 2: Manual Index Creation

If the links don't work, you can manually create the indexes:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Indexes tab
4. Click "Add Index"

### Required Indexes:

#### foodEntries Collection
- Collection ID: `foodEntries`
- Fields to index:
  - `userId` (Ascending)
  - `dateInMils` (Ascending)
  - `deleted` (Ascending)

#### weightLogs Collection
- Collection ID: `weightLogs`
- Fields to index:
  - `userId` (Ascending)
  - `dateFormatted` (Descending)
  - `deleted` (Ascending)

#### userFoods Collection
- Collection ID: `userFoods`
- Fields to index:
  - `userId` (Ascending)
  - `nameLow` (Ascending)

#### customFoods Collection (if used)
- Collection ID: `customFoods`
- Fields to index:
  - `userId` (Ascending)
  - `foodName` (Ascending)

## After Creating Indexes

1. Wait for the indexes to finish building (status will change from "Building" to "Enabled")
2. Refresh your application
3. The queries should now work without errors

If you're still experiencing issues after creating indexes, make sure your query structure matches the indexes you've created.

## Common Problems and Solutions

1. **Query timeout before index creation**: Indexes can take several minutes to build. Be patient and refresh your app after indexes are built.

2. **Multiple indexes needed**: Sometimes your app might need several indexes. Create all indexes that appear in error messages.

3. **Index structure mismatch**: Ensure your query's filter and ordering exactly match the index structure.

4. **Collection names**: Make sure collection names in your code match the collection IDs used in the indexes.

Remember that after creating all necessary indexes, the "My Foods" and "My Recipes" tabs should function without errors. 