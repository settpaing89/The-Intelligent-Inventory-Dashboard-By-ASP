import { useVehicles } from './hooks/useVehicles'

function App() {
  const { data, isLoading, isError, error } = useVehicles()

  return (
    <>
      <h1 className="text-3xl font-bold">Dealership Inventory Dashboard</h1>
      {isLoading && <p>Loading vehicles…</p>}
      {isError && <p>Error: {error.message}</p>}
      {data && <p>Loaded {data.length} vehicles</p>}
    </>
  )
}

export default App
