# alpaca-trading-scripts

> Algotrading bot example using TypeScript

[Learn how to create your first algotrading bot on Medium.](https://medium.com/@ErikKyleNielsen/write-your-first-typescript-algotrading-bot-8194dfe60e5f)

## Installation

```bash
git clone https://github.com/nielse63/alpaca-trading-scripts.git
cd alpaca-trading-scripts
nvm use
npm ci
```

## Usage

```bash
npm run build
npm start
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm test

# with coverage
npm test -- --coverage
```

### Running in production

To execute in a production environment:

```bash
#!/usr/bin/env bash
/path/to/alpaca-trading-scripts/.bin/run
```

### Creating a new release

```bash
gh release create
npm version --no-git-tag-version from-git
git add .
git commit --no-edit --amend
```
