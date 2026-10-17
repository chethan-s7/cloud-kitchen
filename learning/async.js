function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareOrder(dish) {
  console.log(`Kitchen started cooking ${dish}...`);
  await wait(2000);
  console.log(`${dish} is ready!`);
  return dish;
}

async function main() {
  console.log("Order placed");
  await Promise.all([prepareOrder("Biryani"), prepareOrder("Dosa")]);
  console.log("All done");
}

main();
