import { generateContractInterfaces } from 'solidity-typescript-generator'
import { expect, assert } from 'chai'
import { readFile as readFileCallback } from 'fs'
import { promisify } from 'util'
const readFile = promisify(readFileCallback)

describe('generateContractInterfaces', async () => {
	for (const prefix of ['1','2','3','4']) {
		it(`${prefix}`, async () => {
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
})
