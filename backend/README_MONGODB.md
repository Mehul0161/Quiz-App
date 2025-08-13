# MongoDB Atlas Setup for Quiz App Backend

## Step 1: Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (free tier is fine)

## Step 2: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string

## Step 3: Create Database User
1. In Atlas, go to "Database Access"
2. Create a new user with read/write permissions
3. Note the username and password

## Step 4: Set Environment Variables
In your Vercel backend project, set these environment variables:

### Required:
- `MONGODB_URI`: Your MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/quiz-app?retryWrites=true&w=majority`
  - Replace `username`, `password`, and `cluster.mongodb.net` with your actual values

### Optional:
- `GEMINI_API_KEY`: For AI quiz generation
- `FRONTEND_ORIGIN`: For CORS (if needed)

## Step 5: Deploy
1. Commit and push your changes
2. Redeploy your backend on Vercel
3. Test the health endpoint: `https://quiz-app-b-one.vercel.app/api/health`

## Expected Response
The health endpoint should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": "connected"
}
```

## Troubleshooting
- If `mongodb: "disconnected"`, check your `MONGODB_URI` environment variable
- Ensure your MongoDB Atlas cluster is running and accessible
- Check that your database user has the correct permissions
