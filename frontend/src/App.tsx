import { useState, useEffect } from 'react'
import './App.css'

interface Choreography {
  id: string;
  title: string;
  description: string;
  duration: number;
  dancers: number;
}

function App() {
  const [tasks, setTasks] = useState<Choreography[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <div className="card">
        <h2>Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          tasks.map((t: Choreography) => (
            <div key={t.id}>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default App
