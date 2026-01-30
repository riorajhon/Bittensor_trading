import mongoose from 'mongoose';

const subnetSchema = new mongoose.Schema(
  {
    netuid: { type: Number, required: true, unique: true },
    block_number: Number,
    timestamp: Date,
    name: String,
    symbol: String,
    subnet_name: String,
    subnet_description: String,
    description: String,
    price: String,
    rank: Number,
    projected_emission: String,
    emission: String,
    net_flow_1_day: String,
    net_flow_7_days: String,
    net_flow_30_days: String,
    neuron_registration_cost: String,
    incentive_burn: String,
    active_keys: Number,
    max_neurons: Number,
    // taostats / extra
    total_tao: String,
    total_alpha: String,
    alpha_staked: String,
    market_cap: String,
    liquidity: String,
    github: String,
    discord_url: String,
    subnet_contact: String,
    subnet_url: String,
    owner: String,
    registration_timestamp: Date,
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Subnet', subnetSchema);
