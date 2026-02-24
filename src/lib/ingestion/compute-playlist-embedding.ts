export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error("Cannot average an empty list of embeddings.");
  }

  const dim = embeddings[0]!.length;
  const sum = new Array<number>(dim).fill(0);

  for (const embedding of embeddings) {
    if (embedding.length !== dim) {
      throw new Error(
        `Dimension mismatch: expected ${dim}, got ${embedding.length}`,
      );
    }

    for (let i = 0; i < dim; i++) {
      sum[i]! += embedding[i]!;
    }
  }

  return sum.map((v) => v / embeddings.length);
}
