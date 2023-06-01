import { knex } from "./config/knex.js";
import { CronJob } from "cron";
import axios from "axios";

export default () => {
  new CronJob("0 */10 * * * *", fetchPancakeData, null, true, "Europe/Moscow");
};

const query =
  "\nquery positionHistory($pageSize: Int!, $owner: String!) {\n  positions(\n    where: {owner: $owner, liquidity_gt: 1}\n  ) {\n    id\n    liquidity\n    pool {\n      tick\n      feeGrowthGlobal0X128\n      feeGrowthGlobal1X128\n    }\n    tickLower {\n      tickIdx\n      feeGrowthOutside0X128\n      feeGrowthOutside1X128\n    }\n    tickUpper {\n\t\t\ttickIdx\n      feeGrowthOutside0X128\n      feeGrowthOutside1X128\n    }\n    feeGrowthInside0LastX128\n    feeGrowthInside1LastX128\n  }\n}";

const formula = ([g, ol, ou, i, l]) => (((g - ol - ou - i) / 2 ** 128) * l) / (1 * 10 ** 18);

export const fetchPancakeData = async () => {
  console.log("in");
  try {
    const { data } = await axios({
      method: "POST",
      url: "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc",
      data: {
        query,
        variables: {
          owner: "0x61F7a750DeF86Eef2B2ebC7e81B4767b44b92867",
          pageSize: 1000,
        },
      },
    });

    const dataToInsert = data.data.positions.reduce((acc, ps) => {
      if (Number(ps.pool.tick) >= Number(ps.tickUpper.tickIdx) || Number(ps.pool.tick) <= Number(ps.tickLower.tickIdx)) return acc;

      const t1_amount = formula([
        +ps.pool.feeGrowthGlobal0X128,
        +ps.tickLower.feeGrowthOutside0X128,
        +ps.tickUpper.feeGrowthOutside0X128,
        +ps.feeGrowthInside0LastX128,
        +ps.liquidity,
      ]);

      const t2_amount = formula([
        +ps.pool.feeGrowthGlobal1X128,
        +ps.tickLower.feeGrowthOutside1X128,
        +ps.tickUpper.feeGrowthOutside1X128,
        +ps.feeGrowthInside1LastX128,
        +ps.liquidity,
      ]);

      return [...acc, { pool_id: +ps.id, t1_amount, t2_amount, t1_deposit: +ps.depositedToken0, t2_deposit: +ps.depositedToken1 }];
    }, []);

    await knex("history").insert(dataToInsert);
  } catch (error) {
    console.log(error.message || error);
  }
};
