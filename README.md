[![npm (scoped)](https://img.shields.io/npm/v/@zoltu/solidity-typescript-generator?label=npm%20-%20%40zoltu%2Fsolidity-typescript-generator)](https://www.npmjs.com/package/@zoltu/solidity-typescript-generator)

Takes in the output JSON from `solc` and generatese a set of TypeScript classes for interacting with the contracts it references.

## Usage
```
npm install @zoltu/solidity-typescript-generator
```
In your build script that compiles your solidity files
```typescript
import { CompilerOutput, generateContractInterfaces } from '@zoltu/solidity-typescript-generator'
async function compile() {
	const solcOutput = JSON.parse(compileSolidity(...)) as CompilerOutput // specifics depend on your build process
	const typescriptFileContents = await generateContractInterfaces(solcOutput)
	writeFile('../generated/my-contracts.ts', typescriptFileContents) // specifics depend on your build process
}
```
Elsewhere in your project...
```typescript
import { Apple } from '../generated/my-contract'

// from @zoltu/solidity-typescript-generator-fetch-dependencies for use in browser
const fetchBrowserDependencies = new FetchDependencies(new FetchJsonRpc('https://my-node.example.com:8545', window.fetch.bind(window)))
// from @zoltu/solidity-typescript-generator-fetch-dependencies for use in NodeJS with node-fetch package off NPM
const fetchNodeDependencies = new FetchDependencies(new FetchJsonRpc('https://my-node.example.com:8545', fetch))
// from @zoltu/solidity-typescript-generator-browser-dependencies with no fallback
const browserDependenciesWithoutFallback = new BrowserDependencies(undefined)
const browserDependenciesWithFallback = new BrowserDependencies(fetchBrowserDependencies)
// roll your own
const dependencies = {
	call(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		// TODO: implement; make note of the type of `EncodableArray` (bigint, Uint8Array, string, booleans, object, and array)
	}
	submitTransaction(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt> => {
		// TODO: implement; make note of the type of `TransactionReceipt` (needs to be deserialized from wire encoded JSON) expected by `Apple`
	}
}
const apple = new Apple(dependencies, appleAddress)
// leading underscore means do an off-chain call, not an on-chain transaction
const result = await apple._banana(5n, 'hello')
// `result` is a JS type that aligns with the return type of `banana`.  For example, `bigint` if `banana` returns a Solidity `uint256` or an object for a Solidity tuple
console.log(result)
// you can attach value as a last parameter, but only on functions that are payable
const result = await apple._cherry(5n, 'hello', 5n)
// no leading underscore is an on-chain contract call
// addresses are just bigints, which means you can use a bigint literal!
const events = await apple.transfer(0x2FCBaFb681a086103e3d97927d9cA9Af9f1EBD22n, 5n*10n**18n)
// the result of an on-chain call is an array of decoded events that occurred during the call
// every event referenced in the solc output file is strongly typed
const myEvent = events.find(event => event.name === 'MyEvent')! as Apple.MyEvent
console.log(myEvent.amountTransferred)
```
