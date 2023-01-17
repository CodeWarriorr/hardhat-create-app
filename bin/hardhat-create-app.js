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

// Set yarn to v2
console.log('Setting yarn to enable v2...');
spawnSync('yarn', ['set', 'version', 'berry'], { stdio: 'inherit' });

// Initialize a new npm project
console.log('Initializing a new npm project...');
spawnSync('yarn', ['init', '--yes'], { stdio: 'inherit' });

// Remove README.md created by yarn init
console.log('Removing README.md...');
spawnSync('rm', ['README.md'], { stdio: 'inherit' });

// Make sure the nodeLinker is set to node-modules to avoid issues with npx
console.log('Add nodeLinker to .yarnrc.yml...');
const yarnrcPath = path.join(root, '.yarnrc.yml');
const yarnrcContent = fs.readFileSync(yarnrcPath, 'utf-8');
fs.writeFileSync(yarnrcPath, yarnrcContent + 'nodeLinker: node-modules\n');

// Install Hardhat and initialize a new TypeScript project
console.log('Installing Hardhat...');
spawnSync('yarn', ['add', 'hardhat'], { stdio: 'inherit' });

// Initialize a new Hardhat TypeScript project
console.log('Initializing a new Hardhat TypeScript project...');
const result = execSync(
  'HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS=true npx hardhat',
  {
    stdio: 'inherit',
  }
);

// Install Hardhat Plugins
console.log('Installing Hardhat Plugins...');
spawnSync(
  'yarn',
  [
    'add',
    '-D',
    'solhint',
    'prettier',
    'prettier-plugin-solidity',
    'hardhat-deploy',
    '@types/chai',
    '@types/mocha',
    '@types/node',
    'dotenv',
    '@nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers@latest',
    '@openzeppelin/contracts',
    'hardhat-contract-sizer',
    'hardhat-gas-reporter',
  ],
  { stdio: 'inherit' }
);

// Add the "compile" and "test" script to package.json
console.log("Adding the 'compile' script to package.json...");
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.scripts = {
  ...(packageJson.script ?? {}),
  compile: 'hardhat compile',
  test: 'hardhat test',
};
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Remove the default deploy script
console.log('Removing the default deploy script...');
spawnSync('rm', ['scripts/deploy.ts'], { stdio: 'inherit' });

// Edit the hardhat.config.ts
console.log('Editing the hardhat.config.ts...');
const configPath = path.join(root, 'hardhat.config.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');
let modifiedContent = configContent.replace(
  '};',
  `
//  networks: {
//    hardhat: {
//      forking: {
//        url: nodeUrl('matic') ?? '',
//        blockNumber: 37377259, // Latest as of 28.12.2022
//      },
//    },
//    matic: {
//      url: nodeUrl('matic'),
//      accounts: accounts('matic'),
//    },
//    mumbai: {
//      url: nodeUrl('mumbai'),
//      accounts: accounts('mumbai'),
//    },
//    rinkeby: {
//      url: nodeUrl('rinkeby'),
//      accounts: accounts('rinkeby'),
//    },
//  },
//  gasReporter: {
//    enabled: process.env.REPORT_GAS !== undefined,
//    currency: 'USD',
//    token: 'MATIC',
//    gasPriceApi:
//      'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
//    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
//  },
//  etherscan: {
//    apiKey: {
//      mainnet: process.env.ETHERSCAN_API_KEY || '',
//      rinkeby: process.env.ETHERSCAN_API_KEY || '',
//      polygon: process.env.POLYGONSCAN_API_KEY || '',
//      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
//    },
//  },
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

// Add plugins to the config
modifiedContent = modifiedContent.replace(
  `import "@nomicfoundation/hardhat-toolbox";`,
  `import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import { nodeUrl, accounts } from './utils/network';
import * as dotenv from 'dotenv';

dotenv.config();
  `
);
fs.writeFileSync(configPath, modifiedContent);

// Copy files to the project directory
console.log('Copying files to the project directory...');
fs.copySync(path.resolve(__dirname, '../files'), `${root}/`);

// Success message
console.log(`
Success! Created ${projectName} at ${root}.

Inside that directory, you can run several commands:

  yarn run compile
    Compiles the contracts.

  yarn run test
    Runs the tests.

We suggest that you install Hardhat shorthand:

  npm install --global hardhat-shorthand

Happy hacking!
`);
