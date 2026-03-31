import { useMemo, useState } from 'react'
import './App.css'

const STARTING_PLAYERS = [
  { id: 1, name: 'Alex', brought: 100, left: 65 },
  { id: 2, name: 'Sam', brought: 100, left: 120 },
  { id: 3, name: 'Jordan', brought: 100, left: 115 },
]

const EPSILON = 0.001

function normalizeMoney(value) {
  return Math.round(value * 100) / 100
}

function getNet(player) {
  return normalizeMoney((Number(player.left) || 0) - (Number(player.brought) || 0))
}

function computeSettlements(players) {
  const netPlayers = players.map((p) => ({ ...p, balance: getNet(p) }))

  const creditors = netPlayers
    .filter((p) => p.balance > EPSILON)
    .map((p) => ({ ...p }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = netPlayers
    .filter((p) => p.balance < -EPSILON)
    .map((p) => ({ ...p }))
    .sort((a, b) => a.balance - b.balance)

  const transactions = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].balance, creditors[j].balance)
    const roundedAmount = normalizeMoney(amount)

    if (roundedAmount > 0) {
      transactions.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: roundedAmount,
      })
    }

    debtors[i].balance = normalizeMoney(debtors[i].balance + roundedAmount)
    creditors[j].balance = normalizeMoney(creditors[j].balance - roundedAmount)

    if (Math.abs(debtors[i].balance) <= EPSILON) i += 1
    if (Math.abs(creditors[j].balance) <= EPSILON) j += 1
  }

  return transactions
}

function App() {
  const [players, setPlayers] = useState(STARTING_PLAYERS)

  const playersWithNet = useMemo(
    () => players.map((player) => ({ ...player, net: getNet(player) })),
    [players],
  )

  const netTotal = useMemo(
    () => normalizeMoney(playersWithNet.reduce((sum, p) => sum + p.net, 0)),
    [playersWithNet],
  )

  const transactions = useMemo(() => computeSettlements(players), [players])
  const totalMoved = useMemo(
    () => normalizeMoney(transactions.reduce((sum, t) => sum + t.amount, 0)),
    [transactions],
  )

  const canSettle = Math.abs(netTotal) <= EPSILON

  function updatePlayer(id, field, value) {
    setPlayers((current) =>
      current.map((player) => {
        if (player.id !== id) {
          return player
        }

        if (field === 'brought' || field === 'left') {
          return { ...player, [field]: Number(value) }
        }

        return { ...player, [field]: value }
      }),
    )
  }

  function addPlayer() {
    const nextId = players.length ? Math.max(...players.map((p) => p.id)) + 1 : 1
    setPlayers((current) => [
      ...current,
      { id: nextId, name: `Player ${nextId}`, brought: 0, left: 0 },
    ])
  }

  function removePlayer(id) {
    setPlayers((current) => current.filter((player) => player.id !== id))
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Poker Settlement</p>
        <h1>Fuck banking cuz its sped af</h1>
        <p className="hero-copy">
          Enter what each player entered with and what they exited with.
          Net profit/loss is calculated automatically.
        </p>

        <div className="stats-grid">
          <article>
            <span>Players</span>
            <strong>{players.length}</strong>
          </article>
          <article>
            <span>Total moved</span>
            <strong>${totalMoved.toFixed(2)}</strong>
          </article>
          <article>
            <span>Transactions</span>
            <strong>{transactions.length}</strong>
          </article>
        </div>
      </section>

      <section className="entry-panel">
        <header className="entry-header">
          <h2>Player cash flow</h2>
          <div className="button-row">
            <button type="button" onClick={addPlayer}>
              Add player
            </button>
          </div>
        </header>

        <div className="field-label-row" aria-hidden="true">
          <span>Name</span>
          <span>Buy in amount</span>
          <span>Exit amount</span>
          <span></span>
          <span></span>
        </div>

        <div className="entry-list">
          {playersWithNet.map((player) => (
            <div className="player-row" key={player.id}>
              <input
                type="text"
                value={player.name}
                onChange={(event) => updatePlayer(player.id, 'name', event.target.value)}
                aria-label={`Name for ${player.name}`}
              />
              <input
                type="number"
                step="0.01"
                value={Number.isNaN(player.brought) ? '' : player.brought}
                onChange={(event) => updatePlayer(player.id, 'brought', event.target.value)}
                aria-label={`Entered amount for ${player.name}`}
                placeholder="Entered"
              />
              <input
                type="number"
                step="0.01"
                value={Number.isNaN(player.left) ? '' : player.left}
                onChange={(event) => updatePlayer(player.id, 'left', event.target.value)}
                aria-label={`Exit amount for ${player.name}`}
                placeholder="Exit"
              />
              <span className={`net-chip ${player.net >= 0 ? 'up' : 'down'}`}>
                Net {player.net >= 0 ? '+' : ''}${player.net.toFixed(2)}
              </span>
              <button
                type="button"
                className="danger"
                onClick={() => removePlayer(player.id)}
                disabled={players.length <= 2}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className={`validation ${canSettle ? 'ok' : 'bad'}`}>
          {canSettle
            ? 'Balances net to zero. Settlements are valid.'
            : `Net total is $${netTotal.toFixed(2)}. Adjust values until total is $0.00.`}
        </p>
      </section>

      <section className="result-panel">
        <h2>Direct payout instructions</h2>
        <p className="result-copy">
          This is the most optimized banking with the lowest transactions needed
          based on entered and exit amounts.
        </p>

        {!canSettle ? (
          <p className="warning">No payout plan until balances sum to zero.</p>
        ) : transactions.length === 0 ? (
          <p className="warning">Everyone is even. No payments needed.</p>
        ) : (
          <ol className="transaction-list">
            {transactions.map((tx, index) => (
              <li key={`${tx.from}-${tx.to}-${index}`}>
                <span>{tx.from}</span>
                <span className="arrow">pays</span>
                <span>{tx.to}</span>
                <strong>${tx.amount.toFixed(2)}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="app-footer">
        <a
          href="https://github.com/shruthikalle/House-Bank"
          target="_blank"
          rel="noreferrer"
        >
          https://github.com/shruthikalle/House-Bank
        </a>
      </footer>
    </main>
  )
}

export default App
