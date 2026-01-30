import express from 'express';
import fetch from 'node-fetch';
import Subnet from '../models/Subnet.js';

const router = express.Router();
const TAOSTATS_API = 'https://taostats.io/api/dtao/dtaoSubnets';
const DELAY_MS = 300;
const MIN_NETUID = 1;
const MAX_NETUID = 128;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickSubnetFields(raw) {
  if (!raw) return null;
  return {
    netuid: raw.netuid,
    block_number: raw.block_number,
    timestamp: raw.timestamp ? new Date(raw.timestamp) : undefined,
    name: raw.name ?? raw.subnet_name,
    symbol: raw.symbol,
    subnet_name: raw.subnet_name,
    subnet_description: raw.subnet_description,
    description: raw.description,
    price: raw.price,
    rank: raw.rank,
    projected_emission: raw.projected_emission,
    emission: raw.emission,
    net_flow_1_day: raw.net_flow_1_day,
    net_flow_7_days: raw.net_flow_7_days,
    net_flow_30_days: raw.net_flow_30_days,
    neuron_registration_cost: raw.neuron_registration_cost,
    incentive_burn: raw.incentive_burn,
    active_keys: raw.active_keys,
    max_neurons: raw.max_neurons,
    total_tao: raw.total_tao,
    total_alpha: raw.total_alpha,
    alpha_staked: raw.alpha_staked,
    market_cap: raw.market_cap,
    liquidity: raw.liquidity,
    github: raw.github,
    discord_url: raw.discord_url,
    subnet_contact: raw.subnet_contact,
    subnet_url: raw.subnet_url,
    owner: raw.owner,
    registration_timestamp: raw.registration_timestamp ? new Date(raw.registration_timestamp) : undefined,
    lastSyncedAt: new Date(),
  };
}

router.get('/', async (req, res) => {
  try {
    const subnets = await Subnet.find().sort({ netuid: 1 }).lean();
    res.json({ data: subnets, total: subnets.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const results = { ok: 0, failed: 0, errors: [] };
    for (let netuid = MIN_NETUID; netuid <= MAX_NETUID; netuid++) {
      try {
        const url = `${TAOSTATS_API}?netuid=${netuid}`;
        const r = await fetch(url);
        const json = await r.json();
        const item = json?.data?.[0];
        if (!item) {
          results.failed++;
          continue;
        }
        const doc = pickSubnetFields(item);
        await Subnet.findOneAndUpdate(
          { netuid: doc.netuid },
          doc,
          { upsert: true, new: true }
        );
        results.ok++;
      } catch (e) {
        results.failed++;
        results.errors.push({ netuid, message: e.message });
      }
      await sleep(DELAY_MS);
    }
    res.json({ message: 'Refresh complete', ...results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
