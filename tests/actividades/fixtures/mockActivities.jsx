/* eslint-disable react-refresh/only-export-components */

function ActivityFixture({ data, onComplete }) {
  return (
    <section>
      <h1>{data.titulo}</h1>
      <button onClick={onComplete}>Completar actividad</button>
    </section>
  );
}

export default Array.from({ length: 20 }, () => ActivityFixture);
