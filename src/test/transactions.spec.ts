/* eslint-disable no-undef */
import { app } from '../app'
import request from 'supertest'
import { knex } from '../lib/database'
import { config } from 'dotenv'
import { execSync } from 'node:child_process'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config()
}

describe('Transactions E2E Tests', () => {
  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  beforeAll(async () => {
    await knex('transactions').delete()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await knex('transactions').delete()
  })
  it('should be create a new transaction of credit', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit',
    })

    expect(response.statusCode).toBe(204)
  })

  it('not should be able to list transaction without a unauthorized user', async () => {
    const response = await request(app.server).get('/transactions')

    expect(response.statusCode).toBe(401)
  })

  it('should be able to list all transactions to determinate user', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    expect(response.statusCode).toBe(200)
    expect(response.body.transactions).toEqual([
      expect.objectContaining({ title: 'New transaction', amount: 5000 }),
    ])
  })

  it('should be able to get a transaction by id', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const allTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const id = allTransactions.body.transactions[0].id

    const response = await request(app.server)
      .get(`/transactions/${id}`)
      .set('Cookie', cookies)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({ title: 'New transaction', amount: 5000 }),
    )
  })

  it('should be able get a summary from user', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Debit transaction',
        amount: 500,
        type: 'debit',
      })
      .set('Cookie', cookies)

    const response = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)

    expect(response.statusCode).toBe(200)
    expect(response.body.summary).toEqual(
      expect.objectContaining({ amount: 4500 }),
    )
  })
})
