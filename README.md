<div align="center">
  <img height="160x" src="https://user-images.githubusercontent.com/16005567/204155023-4ee739e0-f204-4dd6-b750-17b6395ef58e.png" />

  <h1>Claynoscorz</h1>

  <p>
    <strong>A Claynosaurz Twitter sales bot</strong>
  </p>
</div>

[Claynosaurz](https://claynosaurz.com/) is a 10k pfp project built on [Solana](https://solana.com/). Any time someone scores a Claynosaur (a sale is made), this bot will [tweet about it](https://twitter.com/claynoscores).

## Getting Started

To run this project, you'll need a Twitter account with [elevated access to the API](https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api). This is required because the project uses [OAuth 1.0a User Context](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

1. Clone the repo

    ```bash
    git clone
    ```

2. Setup the environment

    ```bash
    cp .env.example .env
    # Fill out the required variables in .env
    ```

3. Start the dev server

    ```bash
    yarn dev
    ```

## Make your own Twitter bot

1. [Fork this repo](https://github.com/login?return_to=%2Famorriscode%2Fclaynoscorz)
2. Create a [Twitter developer account](https://developer.twitter.com/en)
3. Setup local development (See [Getting Started](#getting-started))
4. Deploy the app on [Render](https://render.com) or similar
   1. Required environment variables are in `.env.example`
5. Create an `NFT_SALE` [Helius webhook](https://docs.helius.xyz/webhooks/getting-started-with-webhooks)

### Helius

[Helius](https://www.helius.dev/) provides [webhooks](https://www.helius.dev/solana-webhooks) based on transactions that occur on the Solana network. After you've deployed your Twitter bot, you'll need to create a [Helius webhook](https://docs.helius.xyz/webhooks/getting-started-with-webhooks). This bot was built to handle `NFT_SALE` events.

For the accounts on the webhook, you need every address of every NFT in your collection. You can do this using the [Metaboss](https://metaboss.rs). As an example: `❯ metaboss collections get-items --collection-mint 9jnJWH9F9t1xAgw5RGwswVKY4GvY2RXhzLSJgpBAhoaR --api-key <API_KEY>`

### Tweet Content

The tweets are constructed inside the `buildTweet` function in `tweet.ts`. Modify this function to change the content of the tweet to fit your project's needs.

### Caching

There is an optional `REDIS_URL` environment variable. It's recommended you setup a Redis instance to cache requests from Helius. This prevents processing NFT sales multiple times. If you don't use Redis, the caching will be done in memory. [Render](https://render.com) has a generous free-tier for an LRU Redis instance that fits the bill nicely.
