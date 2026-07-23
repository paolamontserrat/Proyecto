function PasaporteDiplomas({ diplomas }) {
  if (!diplomas || diplomas.length === 0) return null;

  return (
    <div className="max-w-sm mx-auto bg-white/90 rounded-2xl p-3 mb-6">
      <p className="text-xs font-bold text-alianza-azul mb-2 text-center">Tus diplomas</p>
      <div className="flex flex-wrap justify-center gap-3">
        {diplomas.map((d) => (
          <div key={d.numero} className="flex flex-col items-center">
            <span className="text-2xl">🏆</span>
            <span className="text-[9px] text-gray-500">Diploma {d.numero}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasaporteDiplomas;