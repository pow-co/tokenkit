import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ftFixture, nftFixture } from '../support/fixtures.js'
import tokenkit from '../env/tokenkit.js'
import { run } from '../support/run.js'

chai.use(chaiAsPromised)


const fixture = {
  address: run.purse.address,
  satoshis: 100000
}


describe('DEX.makeOffer() with fungible token', () => {
  let klass, jigbox
  beforeEach(async () => {
    klass = await tokenkit.ft.deploy(ftFixture)

    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
    ])

    jigbox = await tokenkit.ft.getJigBox(klass.origin)
  })

  it('creates a sell for a token', async () => {
    const jig = await tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
      amount: 4000,
    })

    assert.instanceOf(jig, jigbox.contract)
    assert.equal(jig.amount, 4000)
    assert.equal(jig.owner.address, run.purse.address)
    assert.equal(jig.owner.satoshis, 100000)
    assert.equal(jig.sender, run.owner.address)
  })

  it('throws error if jigbox is not a JigBox', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jigbox: { foo: 'bar' },
      amount: 4000,
    })
    await assert.isRejected(promise, /^'jigbox' is invalid/)
  })

  it('throws error if amount is not present', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
    })
    await assert.isRejected(promise, /jigbox with amount/)
  })

  it('throws error if address is invalid', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
      amount: 4000,
      address: 'notanaddress',
    })
    await assert.isRejected(promise, /^'address' is invalid/)
  })

  it('throws error if satoshis is invalid', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
      amount: 4000,
      satoshis: 'abc'
    })
    await assert.isRejected(promise, /^'satoshis' is invalid/)
  })
})


describe('DEX.makeOffer() with non-fungible token', () => {
  let klass, jigbox
  beforeEach(async () => {
    klass = await tokenkit.nft.deploy(nftFixture)

    await tokenkit.ft.mint(klass.origin, [
      run.owner.address,
    ])

    jigbox = await tokenkit.nft.getJigBox(klass.origin)
  })

  it('creates a sell for a token', async () => {
    const jig = await tokenkit.dex.makeOffer({
      ...fixture,
      jig: jigbox.jigs[0],
    })

    assert.instanceOf(jig, jigbox.contract)
    assert.equal(jig.owner.address, run.purse.address)
    assert.equal(jig.owner.satoshis, 100000)
    assert.equal(jig.sender, run.owner.address)
  })

  it('throws error if jigbox is not a JigBox', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jig: { foo: 'bar' },
    })
    await assert.isRejected(promise, /^'jig' is invalid/)
  })

  it('throws error if address is invalid', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jig: jigbox.jigs[0],
      address: 'notanaddress',
    })
    await assert.isRejected(promise, /^'address' is invalid/)
  })

  it('throws error if satoshis is invalid', async () => {
    const promise = tokenkit.dex.makeOffer({
      ...fixture,
      jig: jigbox.jigs[0],
      satoshis: 'abc'
    })
    await assert.isRejected(promise, /^'satoshis' is invalid/)
  })
})


describe('DEX.takeOffer()', () => {
  let klass, jigbox, offer
  beforeEach(async () => {
    klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
    ])

    jigbox = await tokenkit.ft.getJigBox(klass.origin)

    offer = await tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
      amount: 4000,
    })
  })

  it('returns the txid taking the offer', async () => {
    const txid = await tokenkit.dex.takeOffer(offer.location)
    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('puts the token jig in the jigbox', async () => {
    assert.equal(jigbox.balance, 1000)
    assert.lengthOf(jigbox.jigs, 1)

    await tokenkit.dex.takeOffer(offer.location)
    await jigbox.sync()

    assert.equal(jigbox.balance, 5000)
    assert.lengthOf(jigbox.jigs, 2)
  })
})


describe('DEX.cancelOffer()', () => {
  let klass, jigbox, offer
  beforeEach(async () => {
    klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
    ])

    jigbox = await tokenkit.ft.getJigBox(klass.origin)

    offer = await tokenkit.dex.makeOffer({
      ...fixture,
      jigbox,
      amount: 4000,
    })
  })

  it('returns the txid taking the offer', async () => {
    const txid = await tokenkit.dex.cancelOffer(offer.location)
    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('puts the token jig in the jigbox', async () => {
    assert.equal(jigbox.balance, 1000)
    assert.lengthOf(jigbox.jigs, 1)

    await tokenkit.dex.cancelOffer(offer.location)
    await jigbox.sync()

    assert.equal(jigbox.balance, 5000)
    assert.lengthOf(jigbox.jigs, 2)
  })
})