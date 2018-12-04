import { generateContractInterfaces } from 'solidity-typescript-generator'
import { Dependencies, Banana, Bytes, Bytes32, ParameterDescription, Encodable, EncodableTuple, Int56, UInt256, Address, BytesLike, UInt48, UInt8, Int8, Int48, UInt56, Int256, Bytes16, UInt32, UInt16, UInt24, UInt40, Int16, Int24, Int32, Int40 } from './test-data/event-output';
import { expect } from 'chai'
import { BigNumber, bigNumberify, keccak256, AbiCoder, defaultAbiCoder } from 'ethers/utils'
import { readFile as readFileCallback } from 'fs'
import { promisify, TextEncoder } from 'util'

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

	it.skip(`execute event`, async () => {
		const dependencies: Dependencies<BigNumber> = {
			call: async () => null,
			decodeParameters: () => [],
			encodeParameters: (description, parameters) => encodeParameters(description, parameters),
			// a: 5, b: keccak256(pancake), c: bytes(AA), d: address(FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
			submitTransaction: async () => {
				const signature = new Bytes32().from('0x5c4cf109e00bf95f1fe07fc3173b24b6e8f94894407c6ec23c3e5fb82419a6ce')
				const a = new Bytes32().from('0x0000000000000000000000000000000000000000000000000000000000000005')
				const b = new Bytes32().from('0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437')
				const c = new Bytes(1).from('AA')
				const d = new Bytes32().from('0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
				return ({ success: true, events: [ { topics: [ new Bytes32().from('0x5c4cf109e00bf95f1fe07fc3173b24b6e8f94894407c6ec23c3e5fb82419a6ce'), new Bytes32().from('0x37e12c06df127fbd6899289cdd9fb12efc8e54dd30f4ddb20a77b4131e042437'), new Bytes32().from('0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF') ], data: new Bytes(128).from('0x000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001AA00000000000000000000000000000000000000000000000000000000000000') } ] })
			}
		}
		const banana = new Banana(dependencies, new Address().from('0x0000000000000000000000000000000000000000'))
		const events = await banana.cherry()
		expect(events.length).to.equal(1)
		const decodedEvent = events[0]
		expect(decodedEvent.name).to.equal('Durian')
		const durian = decodedEvent as Banana.Durian<BigNumber>
		expect(durian.parameters.a.toNumber()).to.equal(5)
		expect(durian.parameters.b).to.equal(`0x${keccak256('pancake')}`)
		expect(durian.parameters.c).to.equal('0xaa')
		expect(durian.parameters.d).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF')
	})

	// useful for doing one-off testing, set to skip so it doesn't run normally
	it(`sandbox`, async () => {
		const inputJson = await readFile(`./test-data/event-input.json`, { encoding: 'utf8' })
		const input = JSON.parse(inputJson)
		const expected = await readFile(`./test-data/event-output.ts`, { encoding: 'utf8' })
		const result = generateContractInterfaces(input)
		expect(result).to.equal(expected)
	})


	describe('encoding', async () => {
		it('true', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
			const parameters = [ true ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000001
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('false', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
			const parameters = [ false ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('small number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint8'} ]
			const parameters = [ 5 as UInt8 ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000005
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('medium small number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint48'} ]
			const parameters = [ 2**48 - 1 as UInt48 ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000ffffffffffff
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('medium big number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint56'} ]
			const parameters = [ bigNumberify(2).pow(56).sub(1) as UInt56<BigNumber> ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			00000000000000000000000000000000000000000000000000ffffffffffffff
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('large big number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint256'} ]
			const parameters = [ bigNumberify(2).pow(256).sub(1) as UInt256<BigNumber> ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('negative small number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int8'} ]
			const parameters = [ -5 as Int8 ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('negative medium small number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int48'} ]
			const parameters = [ -(2**47) as Int48 ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			ffffffffffffffffffffffffffffffffffffffffffffffffffff800000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('negative medium big number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int56'} ]
			const parameters = [ bigNumberify(2).pow(55).mul(-1) as Int56<BigNumber> ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			ffffffffffffffffffffffffffffffffffffffffffffffffff80000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('negative large big number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'int256'} ]
			const parameters = [ bigNumberify(2).pow(255).mul(-1) as Int256<BigNumber> ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			8000000000000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('address', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'address'} ]
			const parameters = [ new Address().from('1234567890abcdef1234567890abcdef12345678') ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000001234567890abcdef1234567890abcdef12345678
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('string', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'string'} ]
			const parameters = [ 'hello' ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('bytes', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes'} ]
			const parameters = [ new Bytes([0xaa, 0xbb, 0xcc, 0xdd]) ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000004
			aabbccdd00000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('bytes16', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bytes16'} ]
			const parameters = [ new Bytes16().from('12345678901234567890123456789012') ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			1234567890123456789012345678901200000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('empty tuple', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: []} ]
			const parameters = [ [] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = ''
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, static, tuple', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint48' }]} ]
			const parameters = [ {b: (2**48-1) as UInt48} ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000ffffffffffff
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, dynamic, tuple', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }]} ]
			const parameters = [ {b: 'hello'} ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, static, tuple', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'uint48' }, { name: 'c', type: 'address' }]} ]
			const parameters = [ {b: (2**48-1) as UInt48, c: new Address().from('1234567890abcdef1234567890abcdef12345678')} ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000ffffffffffff
			0000000000000000000000001234567890abcdef1234567890abcdef12345678
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, dynamic, tuple', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'tuple', components: [{ name: 'b', type: 'string' }, { name: 'c', type: 'bytes'}]} ]
			const parameters = [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])} ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000004
			aabbccdd00000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, static, fixed length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint48[2]' } ]
			const parameters = [ [ 2**48 - 1 as UInt48, 5 as UInt48 ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000ffffffffffff
			0000000000000000000000000000000000000000000000000000000000000005
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, static, fixed length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'uint48' } ] } ]
			const parameters = [ [ { b: 2**48 - 1 as UInt48 }, { b: 5 as UInt48 } ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000ffffffffffff
			0000000000000000000000000000000000000000000000000000000000000005
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, dynamic, fixed length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[2]' } ]
			const parameters = [ [ 'hello', 'goodbye' ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000007
			676f6f6462796500000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, dynamic, fixed length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[2]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
			const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000100
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000004
			aabbccdd00000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000007
			676f6f6462796500000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000005
			1122334455000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, static, dynamic length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'uint48[]' } ]
			const parameters = [ [ 2**48 - 1 as UInt48, 5 as UInt48 ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000002
			0000000000000000000000000000000000000000000000000000ffffffffffff
			0000000000000000000000000000000000000000000000000000000000000005
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, static, dynamic length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'uint48' } ] } ]
			const parameters = [ [ { b: 2**48 - 1 as UInt48 }, { b: 5 as UInt48 } ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000002
			0000000000000000000000000000000000000000000000000000ffffffffffff
			0000000000000000000000000000000000000000000000000000000000000005
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('simple, dynamic, dynamic length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'string[]' } ]
			const parameters = [ [ 'hello', 'goodbye' ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000002
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000007
			676f6f6462796500000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
		it('complex, dynamic, dynamic length, array', async () => {
			const abi: Array<ParameterDescription> = [ { name: 'a', type: 'tuple[]', components: [ { name: 'b', type: 'string' }, { name: 'c', type: 'bytes' } ] } ]
			const parameters = [ [ {b: 'hello', c: new Bytes([0xaa, 0xbb, 0xcc, 0xdd])}, {b: 'goodbye', c: new Bytes([0x11, 0x22, 0x33, 0x44, 0x55])} ] ]
			const encoded = encodeParameters<BigNumber>(abi, parameters)
			const expected = `
			0000000000000000000000000000000000000000000000000000000000000020
			0000000000000000000000000000000000000000000000000000000000000002
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000100
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000005
			68656c6c6f000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000004
			aabbccdd00000000000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000040
			0000000000000000000000000000000000000000000000000000000000000080
			0000000000000000000000000000000000000000000000000000000000000007
			676f6f6462796500000000000000000000000000000000000000000000000000
			0000000000000000000000000000000000000000000000000000000000000005
			1122334455000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, '')
			expect(bytesToHex(encoded)).to.equal(expected)
		})
	})

	describe.only('decoding', async () => {
		it('boolean true', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
			const data = new Bytes(32).from(`
			0000000000000000000000000000000000000000000000000000000000000001
			`.replace(/[\n\t]/g, ''))
			const decoded = decodeParameters<BigNumber>(abi, data)
			const expected = [true]
			expect(decoded).to.deep.equal(expected)
		})
		it('boolean false', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'bool'} ]
			const data = new Bytes(32).from(`
			0000000000000000000000000000000000000000000000000000000000000000
			`.replace(/[\n\t]/g, ''))
			const decoded = decodeParameters<BigNumber>(abi, data)
			const expected = [false]
			expect(decoded).to.deep.equal(expected)
		})
		it('small number', async () => {
			const abi: Array<ParameterDescription> = [ {name: 'a', type: 'uint48'} ]
			const data = new Bytes(32).from(`
			0000000000000000000000000000000000000000000000000000ffffffffffff
			`.replace(/[\n\t]/g, ''))
			const decoded = decodeParameters<BigNumber>(abi, data)
			const expected = [2**48 - 1]
			expect(decoded).to.deep.equal(expected)
		})
	})
})



// test helpers
const bytesToHex = (array: Uint8Array): string => numbersToHex(Array.from(array))
const numbersToHex = (array: Array<number>): string => array.map(x => x.toString(16).padStart(2, '0')).join('')



export function decodeParameters<TLargeInteger>(descriptions: Array<ParameterDescription>, data: BytesLike): Array<Encodable<TLargeInteger>> {
	let offset = 0
	const decoded = []
	for (let description of descriptions) {
		const { result, consumed } = decodeParameter(description, data.subarray(offset))
		offset += consumed
		decoded.push(result)
	}
	return decoded
}

export function decodeParameter<TLargeInteger>(description: ParameterDescription, data: BytesLike): { result: Encodable<TLargeInteger>, consumed: number } {
	return tryDecodeBoolean(description, data)
		|| tryDecodeSmallNumber(description, data)
		|| function () { throw new Error(`Unsupported parameter type ${description.type}`) }()
}

export function tryDecodeBoolean(description: ParameterDescription, data: BytesLike): { result: boolean, consumed: number } | null {
	if (description.type !== 'bool') return null
	const bytes = new Bytes32().from(data.subarray(0, 32))
	const decoded = decodeSmallInteger(bytes)
	return { result: !!decoded, consumed: 32 }
}

export function tryDecodeSmallNumber(description: ParameterDescription, data: BytesLike): { result: UInt8 | UInt16 | UInt24 | UInt32 | UInt40 | UInt48 | Int8 | Int16 | Int24 | Int32 | Int40 | Int48, consumed: number } | null | undefined {
	const match = /^u?int(\d*)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (size > 52) return null
	const bytes = new Bytes32().from(data.subarray(0, 32))
	const decoded = decodeSmallInteger(bytes)
	if (size === 8) return { result: decoded as UInt8, consumed: 32 }
	else if (size === 16) return { result: decoded as UInt16, consumed: 32 }
	else if (size === 24) return { result: decoded as UInt24, consumed: 32 }
	else if (size === 32) return { result: decoded as UInt32, consumed: 32 }
	else if (size === 40) return { result: decoded as UInt40, consumed: 32 }
	else if (size === 48) return { result: decoded as UInt48, consumed: 32 }
}



export function encodeParameters<TLargeInteger>(descriptions: Array<ParameterDescription>, parameters: Array<Encodable<TLargeInteger>>): Bytes {
	if (descriptions.length !== parameters.length) throw new Error(`Number of provided parameters (${parameters.length}) does not match number of expected parameters (${descriptions.length})`)
	const encodedParameters = parameters.map((nestedParameter, index) => encodeParameter(descriptions[index], nestedParameter))
	return encodeDynamicData(encodedParameters)
}

export function encodeParameter<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } {
	return tryEncodeFixedArray(description, parameter)
		|| tryEncodeDynamicArray(description, parameter)
		|| tryEncodeTuple(description, parameter)
		|| tryEncodeDynamicBytes(description, parameter)
		|| tryEncodeString(description, parameter)
		|| tryEncodeBoolean(description, parameter)
		|| tryEncodeSmallNumber(description, parameter)
		|| tryEncodeLargeNumber(description, parameter)
		|| tryEncodeAddress(description, parameter)
		|| tryEncodeFixedBytes(description, parameter)
		|| tryEncodeFixedPointNumber(description)
		|| tryEncodeFunction(description)
		|| function () { throw new Error(`Unsupported parameter type ${description.type}`) }()
}

export function tryEncodeFixedArray<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	const match = /^(.*)\[(\d+)\]$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[2])
	if (!Array.isArray(parameter) || parameter.length !== size) throw new Error(`Can only encode a JavaScript 'array' of length ${size} into an EVM 'array' of length ${size}\n${parameter}`)
	const nestedDescription = Object.assign({}, description, { type: match[1] })
	const encodedParameters = parameter.map(nestedParameter => encodeParameter(nestedDescription, nestedParameter))
	const isDynamic = encodedParameters.some(x => x.isDynamic)
	if (isDynamic) {
		return { isDynamic: isDynamic, bytes: encodeDynamicData(encodedParameters)}
	} else {
		return { isDynamic: isDynamic, bytes: concatenateBytes(encodedParameters.map(x => x.bytes)) }
	}
}

export function tryEncodeDynamicArray<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (!description.type.endsWith('[]')) return null
	if (!Array.isArray(parameter)) throw new Error(`Can only encode a JavaScript 'array' into an EVM 'array'\n${parameter}`)
	const nestedDescription = Object.assign({}, description, { type: description.type.substring(0, description.type.length - 2) })
	const encodedParameters = parameter.map(nestedParameter => encodeParameter(nestedDescription, nestedParameter))
	const lengthBytes = numberToBytes32(encodedParameters.length)
	return { isDynamic: true, bytes: concatenateBytes([lengthBytes, encodeDynamicData(encodedParameters)]) }
}

export function tryEncodeTuple<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'tuple') return null
	if (typeof parameter !== 'object') throw new Error(`Can only encode a JavaScript 'object' into an EVM 'tuple'\n${parameter}`)
	if (description.components === undefined || description.components.length === 0) {
		return { isDynamic: false, bytes: new Uint8Array(0) }
	} else {
		const encodableTuple = parameter as EncodableTuple<TLargeInteger>
		const encodedComponents = description.components.map(component => encodeParameter(component, encodableTuple[component.name]))
		const isDynamic = encodedComponents.some(x => x.isDynamic)
		return { isDynamic: isDynamic, bytes: isDynamic ? encodeDynamicData(encodedComponents) : concatenateBytes(encodedComponents.map(x => x.bytes)) }
	}
}

export function tryEncodeDynamicBytes<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'bytes') return null
	if (!(parameter instanceof Uint8Array)) throw new Error(`Can only encode a JavaScript 'Uint8Array' into EVM 'bytes'\n${parameter}`)
	return { isDynamic: true, bytes: padAndLengthPrefix(parameter) }
}

export function tryEncodeString<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'string') return null
	if (typeof parameter !== 'string') throw new Error(`Can only encode a JavaScript 'string' into an EVM 'string'\n${parameter}`)
	const encoded = new TextEncoder().encode(parameter)
	return { isDynamic: true, bytes: padAndLengthPrefix(encoded) }
}

export function tryEncodeBoolean<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'bool') return null
	if (typeof parameter !== 'boolean') throw new Error(`Can only encode JavaScript 'boolean' into EVM 'bool'\n${parameter}`)
	const result = new Uint8Array(32)
	result.set([parameter ? 1 : 0], 31)
	return { isDynamic: false, bytes: result as Bytes }
}

export function tryEncodeSmallNumber<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	const match = /^u?int(\d*)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (size > 52) return null
	if (typeof parameter !== 'number') throw new Error(`Can only encode a JavaScript 'number' into an EVM '${description.type}'\n${parameter}`)
	return { isDynamic: false, bytes: numberToBytes32(parameter) }
}

export function tryEncodeLargeNumber<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	const match = /^u?int(\d*)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (size <= 52) return null
	if (!isLargeInteger(parameter)) throw new Error(`Can only encode a JavaScript 'TLargeInteger' into an EVM '${description.type}'\n${parameter}`)
	return { isDynamic: false, bytes: encodeInteger(parameter) }
}

export function tryEncodeAddress<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'address') return null
	if (!(parameter instanceof Uint8Array) || parameter.length !== 20) throw new Error(`Can only encode JavaScript 'Uint8Array(20)' into EVM 'address'\n${parameter}`)
	return { isDynamic: false, bytes: padLeftTo32Bytes(parameter) }
}

export function tryEncodeFixedBytes<TLargeInteger>(description: ParameterDescription, parameter: Encodable<TLargeInteger>): { isDynamic: boolean, bytes: BytesLike } | null {
	const match = /^bytes(\d+)$/.exec(description.type)
	if (match === null) return null
	const size = Number.parseInt(match[1])
	if (!(parameter instanceof Uint8Array) || parameter.length !== size) throw new Error(`Can only encode JavaScript 'Uint8Array(${size})' into EVM 'bytes${size}'\n${parameter}`)
	return { isDynamic: false, bytes: padRightTo32Bytes(parameter) as BytesLike }
}

export function tryEncodeFixedPointNumber(description: ParameterDescription): { isDynamic: boolean, bytes: BytesLike } | null {
	if (!/^u?fixed\d+x\d+$/.test(description.type)) return null
	throw new Error(`Encoding into EVM type ${description.type} is not supported`)
}

export function tryEncodeFunction(description: ParameterDescription): { isDynamic: boolean, bytes: BytesLike } | null {
	if (description.type !== 'function') return null
	throw new Error(`Encoding into EVM type ${description.type} is not supported`)
}

// helpers
function padLeftTo32Bytes(input: BytesLike): Bytes32 {
	const result = new Uint8Array(input.length + 32 - input.length % 32)
	result.set(input, result.length - input.length)
	return result as Bytes32
}

function padRightTo32Bytes(input: BytesLike): Bytes32 {
	const result = new Uint8Array(input.length + 32 - input.length % 32)
	result.set(input, 0)
	return result as Bytes32
}

function concatenateBytes(source: Array<BytesLike>): Bytes {
	const size = source.reduce((previous, current) => previous += current.byteLength, 0)
	const result = new Uint8Array(size)
	let offset = 0
	for (let array of source) {
		result.set(array, offset)
		offset += array.byteLength
	}
	return result as Bytes
}

function numberToBytes32(source: number): Bytes32 {
	if (!Number.isSafeInteger(source)) throw new Error(`Cannot construct a Bytes32 from an unsafe integer like ${source}.`)
	return encodeInteger(source)
}

function padAndLengthPrefix(source: BytesLike): Bytes {
	const length = source.length
	const padded = padRightTo32Bytes(source)
	return concatenateBytes([numberToBytes32(length), padded])
}

function encodeDynamicData(encodedData: Array<{ isDynamic: boolean, bytes: BytesLike }>): Bytes {
	let staticBytesSize = 0
	for (let encodedParameter of encodedData) {
		if (encodedParameter.isDynamic) staticBytesSize += 32
		else staticBytesSize += encodedParameter.bytes.length
	}
	const staticBytes = []
	const dynamicBytes = []
	for (let encodedParameter of encodedData) {
		if (encodedParameter.isDynamic) {
			staticBytes.push(numberToBytes32(dynamicBytes.reduce((total, bytes) => total += bytes.length, 0) + staticBytesSize))
			dynamicBytes.push(encodedParameter.bytes)
		} else {
			staticBytes.push(encodedParameter.bytes)
		}
	}
	return concatenateBytes([...staticBytes, ...dynamicBytes])
}

// dependencies needed
function isLargeInteger<TLargeInteger>(x: TLargeInteger): boolean {
	return x instanceof BigNumber
}

function encodeInteger<TLargeInteger>(x: number | TLargeInteger): Bytes32 {
	const value = (typeof x === 'number') ? new BigNumber(x) : x as any as BigNumber
	const result = new Uint8Array(32)
	const stringified = ('0000000000000000000000000000000000000000000000000000000000000000' + value.toTwos(256).toHexString().substring(2)).slice(-64)
	for (let i = 0; i < stringified.length; i += 2) {
		result[i/2] = Number.parseInt(stringified[i] + stringified[i+1], 16)
	}
	return result as Bytes32
}

function decodeLargeInteger<TLargeInteger>(data: Bytes32): TLargeInteger {
	return new BigNumber(data.to0xString()).fromTwos(256) as unknown as TLargeInteger
}

function decodeSmallInteger(data: Bytes32): number {
	return new BigNumber(data.to0xString()).fromTwos(256).toNumber()
}
