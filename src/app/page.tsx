export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      {/* Brand logo — gradient text */}
      <h1 className="font-heading text-6xl font-bold gradient-text">
        OOTD AI
      </h1>

      {/* Tagline */}
      <p className="text-neutral-400 text-lg tracking-wide">
        Your AI-powered style bestie
      </p>

      {/* Genre pill badges — preview of the 12 genres */}
      <div className="flex flex-wrap justify-center gap-2 max-w-md mt-4">
        {[
          "Old Money", "Streetwear", "Y2K", "Minimalist",
          "Dark Academia", "Coastal", "Cottagecore", "Grunge",
          "Athleisure", "Bohemian", "Preppy", "Edgy",
        ].map((genre) => (
          <span
            key={genre}
            className="glass px-3 py-1.5 rounded-full text-sm text-neutral-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-default"
          >
            {genre}
          </span>
        ))}
      </div>
    </main>
  );
}
