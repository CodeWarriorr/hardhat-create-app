#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const projectName = process.argv[2];

if (!projectName) {
  console.error('No project name specified');
  process.exit(1);
}

const root = path.resolve(projectName);

fs.ensureDirSync(root);
process.chdir(root);

console.log(`Creating a new Hardhat project in ${root}.`);

// Initialize a new npm project
console.log('Initializing a new npm project...');
spawnSync('npm', ['init', '-y'], { stdio: 'inherit' });

// Install Hardhat and initialize a new TypeScript project
console.log('Installing Hardhat...');
spawnSync('npm', ['install', 'hardhat'], { stdio: 'inherit' });

console.log('Initializing a new Hardhat TypeScript project...');
const result = execSync(
  'HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS=true npx hardhat',
  {
    stdio: 'inherit',
  }
);

console.log('Installing Hardhat Plugins...');
spawnSync(
  'npm',
  [
    'install',
    '--save-dev',
    '-f',
    'solhint',
    'prettier',
    'prettier-plugin-solidity',
    'hardhat-deploy',
    '@types/chai',
    '@types/mocha',
    '@types/node',
    'dotenv',
    '@nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers',
    '@openzeppelin/contracts',
    'hardhat-contract-sizer',
    'hardhat-gas-reporter',
  ],
  { stdio: 'inherit' }
);

// Add the "compile" script to package.json
console.log("Adding the 'compile' script to package.json...");
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.scripts.compile = 'hardhat compile';
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Edit the hardhat.config.ts
console.log('Editing the hardhat.config.ts...');
const configPath = path.join(root, 'hardhat.config.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');
let modifiedContent = configContent.replace(
  '};',
  `
  networks: {
    hardhat: {
      forking: {
        url: nodeUrl('matic') ?? '',
        blockNumber: 37377259, // Latest as of 28.12.2022
      },
    },
    matic: {
      url: nodeUrl('matic'),
      accounts: accounts('matic'),
    },
    mumbai: {
      url: nodeUrl('mumbai'),
      accounts: accounts('mumbai'),
    },
    rinkeby: {
      url: nodeUrl('rinkeby'),
      accounts: accounts('rinkeby'),
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    token: 'MATIC',
    gasPriceApi:
      'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      rinkeby: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  mocha: {
    timeout: 0,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    proxyAdminOwner: {
      default: 1,
    },
    bob: {
      default: 5,
    },
    alice: {
      default: 6,
    },
    mat: {
      default: 7,
    },
  },
};
  `
);

modifiedContent = modifiedContent.replace(
  `import "@nomicfoundation/hardhat-toolbox";`,
  `import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import { nodeUrl, accounts } from './utils/network';
import * as dotenv from 'dotenv';
import './tasks/acl';

dotenv.config();
  `
);
fs.writeFileSync(configPath, modifiedContent);

// Copy files to the project directory
console.log('Copying files to the project directory...');
fs.copySync(path.resolve(__dirname, '../files'), `${root}/`);

console.log(`
Success! Created ${projectName} at ${root}.

Inside that directory, you can run several commands:

  npm run compile
    Compiles the contracts.

  npm run test
    Runs the tests.

  npm run test:watch
    Runs the tests in watch mode.

We suggest that you begin by typing:

  cd ${projectName}
  npm run test

Happy hacking!
`);
