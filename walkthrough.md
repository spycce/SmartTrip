# Docker Deployment Walkthrough

This guide explains how to build and run the SmartTrip Planner application using Docker.

## Prerequisites

- Docker and Docker Compose installed.
- An API Key for Google Gemini (Get it from Google AI Studio).

## Setup

1.  **Environment Variables**:
    A `.env` file has been created in the root directory. Open it and add your Gemini API Key:
    ```env
    API_KEY=your_actual_api_key_here
    ```

2.  **Build and Run**:
    Run the following command in the root directory to build the images and start the containers:
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the Application**:
    -   **Frontend**: Open [http://localhost](http://localhost) in your browser.
    -   **Backend API**: Accessible at [http://localhost:5000](http://localhost:5000).

## Stopping the Application

To stop the containers, run:
```bash
docker-compose down
```

## Troubleshooting

-   **Build Errors**: If you encounter errors related to `npm install`, ensure you have a stable internet connection as the build process fetches dependencies.
-   **API Key Issues**: If the AI features don't work, verify that the `API_KEY` in `.env` is correct and that you have rebuilt the containers (`docker-compose up --build -d`) after changing the `.env` file.
