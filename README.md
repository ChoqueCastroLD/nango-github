# GitHub Repository Statistics Integration

This integration fetches statistics from GitHub repositories using Nango, focusing on pull requests, commits, and stars. It's designed to handle rate limits efficiently and provide detailed information about repository activity.

## Features

- **Pull Requests Sync**: Fetches PR details including author information, labels, and comment counts
- **Commits Sync**: Retrieves commit history with author details and change statistics
- **Stars Sync**: Collects information about repository stargazers
- **Rate Limit Handling**: Implements efficient rate limit management for GitHub's GraphQL API
- **Pagination**: Handles large repositories through cursor-based pagination

## Implementation Details

### Architecture

The integration is structured into three main components:

1. **Syncs**: Main data fetching logic
   - `github-pullrequests.ts`: Handles PR data collection
   - `github-commits.ts`: Manages commit history retrieval
   - `github-stars.ts`: Collects stargazer information

2. **Mappers**: Data transformation layer
   - `to-pullrequest.ts`: Transforms PR data
   - `to-commit.ts`: Transforms commit data
   - `to-stargazer.ts`: Transforms stargazer data

3. **Helpers**: Utility functions
   - Rate limit management
   - Time limit checks
   - Input validation

### Key Decisions

1. **GraphQL API Usage**
   - Chose GraphQL over REST for efficient data fetching
   - Allows fetching multiple related entities in a single request
   - Better rate limit management

2. **Rate Limit Handling**
   - Implemented `waitForGraphQLRateLimitIfNeeded` helper
   - Tracks remaining API calls and costs
   - Prevents hitting GitHub's rate limits

3. **Pagination Strategy**
   - Used cursor-based pagination for efficient data retrieval
   - Batch size of 100 items per request
   - Maintains state between requests

4. **Error Handling**
   - Comprehensive error checking for API responses
   - Graceful handling of missing or malformed data
   - Detailed logging for debugging

## Repository-Specific Features

The integration supports repository-specific configurations:

- **nango**
  - PullRequest: `isOutsideContributor` flag
  - Commit: `isBot` flag

- **integration-templates**
  - PullRequest: `daysOpenBeforeMerged` tracking

- **axios**
  - PullRequest: `numberOfDaysOpen` tracking

## Performance Considerations

1. **Batch Processing**
   - Uses Nango's batch save functionality
   - Reduces database operations
   - Improves overall sync performance

2. **Efficient Data Fetching**
   - Only requests required fields
   - Minimizes API calls
   - Optimizes network usage

3. **Time Management**
   - Implements 20-hour time limit
   - Prevents infinite syncs
   - Ensures resource efficiency

## Future Improvements

1. **Enhanced Error Recovery**
   - Implement retry mechanisms
   - Better handling of network issues
   - More detailed error reporting

2. **Additional Metrics**
   - Repository activity trends
   - Contributor statistics

3. **Performance Optimizations**
   - Parallel processing for large repositories
   - Caching frequently accessed data
   - Optimized query patterns

## Setup and Usage

1. Create a GitHub App and configure it in Nango
2. Deploy the integration to your Nango account
3. Create connections for each repository
4. Configure repository-specific settings
5. Start the syncs


## Test Locally


Test github-stars locally with validation

```
nango dryrun github-stars test-connection-id -m '{"owner":"NangoHQ","repo":"sample-app"}' --validation
```

Test github-commits locally with validation

```
nango dryrun github-commits test-connection-id -m '{"owner":"ChoqueCastroLD","repo":"nango-github"}' --validation
```

Test github-pullrequests locally with validation

```
nango dryrun github-pullrequests test-connection-id -m '{"owner":"NangoHQ","repo":"datadog-agent"}' --validation
```
