import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
;(use as Function)(chaiAsPromised)
import { promises as fs } from 'fs'
import { generateContractInterfaces } from '@zoltu/solidity-typescript-generator'
import { Dependencies, Banana } from './test-data/event-output'
import * as ComplexContract from './test-data/complex-output'

describe('generateContractInterfaces', async () => {
	async function testContractGeneration(prefix: string) {
		const inputJson = await fs.readFile(`./test-data/${prefix}-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await fs.readFile(`./test-data/${prefix}-output.ts`, { encoding: 'utf8' })
		const result = await generateContractInterfaces(input)
		// await fs.writeFile(`./test-data/${prefix}-output.ts`, result)
		expect(result).to.equal(expected)
	}

	it(`generate 1`, async () => {
		await testContractGeneration('1')
	})

	it(`generate 2`, async () => {
		await testContractGeneration('2')
	})

	it(`generate 3`, async () => {
		await testContractGeneration('3')
	})

	it(`generate 4`, async () => {
		await testContractGeneration('4')
	})

	it(`generates complex`, async () => {
		await testContractGeneration('complex')
	})

	it(`generates duplicate contract`, async () => {
		await testContractGeneration('duplicate-contracts')
	})

	it(`generates event`, async () => {
		await testContractGeneration('event')
	})

	it(`generates excess event properties`, async () => {
		await testContractGeneration('excess-event-properties')
	})

	it(`generates event duplicate`, async () => {
		await testContractGeneration('event-duplicate')
	})

	it(`generates small number return`, async () => {
		await testContractGeneration('small-number-return')
	})

	it(`generates unnamed return`, async () => {
		await testContractGeneration('unnamed-return')
	})

	it(`generates multiple returns`, async () => {
		await testContractGeneration('multiple-returns')
	})

	it(`errors on multiple unnamed returns`, async () => {
		const inputJson = await fs.readFile(`./test-data/error-multiple-unnamed-returns-input.json`, { encoding: 'utf8' })
		const expected = await fs.readFile(`./test-data/error-multiple-unnamed-returns-output.txt`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const resultPromise = generateContractInterfaces(input)
		await expect(resultPromise).to.eventually.be.rejectedWith(expected)
	})

	// useful for doing one-off testing, set to skip so it doesn't run normally
	it.skip(`sandbox`, async () => {
		const inputJson = await fs.readFile(`./test-data/event-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await fs.readFile(`./test-data/event-output.ts`, { encoding: 'utf8' })
		const result = generateContractInterfaces(input)
		expect(result).to.equal(expected)
	})
})

describe('execute', async () => {
	it(`execute event`, async () => {
		const dependencies: Dependencies = {
			call: async () => new Uint8Array(0),
			// a: 5, b: keccak256(pancake), c: bytes(AA), d: address(FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
			submitTransaction: async () => {
				return ({
					status: true,
					logs: [ {
						topics: [
							0x5c4cf109e00bf95f1fe07fc3173b24b6e8f94894407c6ec23c3e5fb82419a6cen,
							0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437n,
							0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn,
						],
						data: new Uint8Array('000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001AA00000000000000000000000000000000000000000000000000000000000000'.match(/[a-fA-F0-9]{2}/g)!.map(byte => Number.parseInt(byte, 16)))
					}]
				})
			},
		}
		const banana = new Banana(dependencies, 0x0000000000000000000000000000000000000000n)
		const events = await banana.cherry()
		expect(events.length).to.equal(1)
		const decodedEvent = events[0]
		expect(decodedEvent.name).to.equal('Durian')
		const durian = decodedEvent as Banana.Durian
		expect(durian.parameters.a).to.equal(5n)
		expect(durian.parameters.b).to.equal(0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437n)
		expect(durian.parameters.c).to.deep.equal(new Uint8Array([0xaa]))
		expect(durian.parameters.d).to.equal(0xffffffffffffffffffffffffffffffffffffffffn)
	})

	it(`Error(string) response to eth_call`, async () => {
		const dependencies: Dependencies = {
			call: async () => new Uint8Array('08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000039436f6e7472616374206372656174696f6e2072657475726e6564206164647265737320302c20696e6469636174696e67206661696c7572652e00000000000000'.match(/[a-fA-F0-9]{2}/g)!.map(byte => Number.parseInt(byte, 16))),
			submitTransaction: async () => { throw new Error(`not implemented`) },
		}
		const banana = new Banana(dependencies, 0x0000000000000000000000000000000000000000n)
		const result = banana.cherry_()
		await expect(result).to.be.rejectedWith('Contract creation returned address 0, indicating failure.')
	})

	it(`can call complex function`, async () => {
		const dependencies: Dependencies = {
			call: async () => new Uint8Array(0),
			submitTransaction: async () => {
				return ({
					status: true,
					logs: [ {
						topics: [
							0x5c4cf109e00bf95f1fe07fc3173b24b6e8f94894407c6ec23c3e5fb82419a6cen,
							0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437n,
							0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn,
						],
						data: new Uint8Array('000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001AA00000000000000000000000000000000000000000000000000000000000000'.match(/[a-fA-F0-9]{2}/g)!.map(byte => Number.parseInt(byte, 16)))
					}]
				})
			}
		}
		const banana = new ComplexContract.Banana(dependencies, 0x0n)
		await banana.cherry([[{ a: 0n, b: 1n, c: { d: true }, e: 'apple' }]])
	})
})
