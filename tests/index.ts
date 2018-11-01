import { generateContractInterfaces } from 'solidity-typescript-generator'
import { Banana, Dependencies } from './test-data/event-output'
import BN = require('bn.js');
import { expect } from 'chai'
import { AbiCoder } from 'ethers/utils'
import { readFile as readFileCallback } from 'fs'
import { keccak256 } from 'js-sha3'
import { promisify } from 'util'
const readFile = promisify(readFileCallback)


describe('generateContractInterfaces', async () => {
	for (const prefix of ['1','2','3','4','event','event-duplicate']) {
		it(`generate ${prefix}`, async () => {
			const inputJson = await readFile(`./test-data/${prefix}-input.json`, { encoding: 'utf8' })
			const input = JSON.parse(inputJson)
			const expected = await readFile(`./test-data/${prefix}-output.ts`, { encoding: 'utf8' })
			const result = generateContractInterfaces(input)
			expect(result).to.equal(expected)
		})
	}
	for (const prefix of ['5']) {
		it(`error ${prefix}`, async () => {
			const inputJson = await readFile(`./test-data/${prefix}-input.json`, { encoding: 'utf8' })
			const expected = await readFile(`./test-data/${prefix}-output.txt`, { encoding: 'utf8' })
			const input = JSON.parse(inputJson)
			expect(generateContractInterfaces.bind(null, input)).to.throw(expected)
		})
	}

	it(`execute event`, async () => {
		const dependencies: Dependencies<BN> = {
			call: async () => '0x',
			decodeParams: (abiParameters, encoded) => new AbiCoder().decode(abiParameters, encoded),
			encodeParams: () => 'encodeParams',
			getDefaultAddress: async () => '0x0000000000000000000000000000000000000000',
			keccak256: keccak256,
			// a: 5, b: keccak256(pancake), c: bytes(AA), d: address(FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
			submitTransaction: async () => ({ status: 1, logs: [ { topics: [ '0x7370a62ee3c7c340084cac325e4791fd5cbc470fac97c3a6799fb43c0ab5a266', '0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437', '0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' ], data: '0x000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001AA00000000000000000000000000000000000000000000000000000000000000' } ] })
		}
		const banana = new Banana(dependencies, '0x0000000000000000000000000000000000000000')
		const events = await banana.cherry()
		expect(events.length).to.equal(1)
		expect(events[0].name).to.equal('durian')
		const parameters = <{a:BN,b:string,c:string,d:string}>(events[0].parameters)
		expect(parameters.a.toNumber()).to.equal(5)
		expect(parameters.b).to.equal(`0x${keccak256('pancake')}`)
		expect(parameters.c).to.equal('0xaa')
		expect(parameters.d).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF')
	})

	// useful for doing one-off testing, set to skip so it doesn't run normally
	it.skip(`event`, async () => {
		const inputJson = await readFile(`./test-data/event-duplicate-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await readFile(`./test-data/event-duplicate-output.ts`, { encoding: 'utf8' })
		const result = generateContractInterfaces(input)
		expect(result).to.equal(expected)
	})
})
