import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, useAccount, useConnect, useSendTransaction, http } from 'wagmi';
import { embeddedWallet, userHasWallet } from '@civic/auth-web3';
import { CivicAuthProvider, UserButton, useUser } from '@civic/auth-web3/react';
import { baseSepolia, mainnet, polygonAmoy, sepolia } from "wagmi/chains";
import { useEffect } from "react";

const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) throw new Error('CLIENT_ID is required');


const wagmiConfig = createConfig({
  chains: [ baseSepolia, polygonAmoy ],
  transports: {
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
  connectors: [
    embeddedWallet({ debug: true }),
  ],
  ssr: true,
});

// Wagmi requires react-query
const queryClient = new QueryClient();

const App = () => {
  // the civic user hook
  const userContext = useUser();

  // add the wagmi hooks
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  // A function that creates the wallet if the user doesn't have one already
  const createWallet = () => {
    if (userContext && !userHasWallet(userContext)) {
      // once the wallet is created, we can connect it straight away
      return userContext.createWallet().then(connectExistingWallet)
    }
  }

  const connectExistingWallet = () => connect({
    connector: connectors[0]
  })

  const sendTx = () => sendTransaction({
    to: '0x...',
    value: 1000n,
  });

  useEffect(() => {
    console.log('userContext print', userContext);
  }, [userContext])

  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <CivicAuthProvider clientId={CLIENT_ID}>
            { !userHasWallet(userContext) &&
                <button onClick={createWallet}>Create Wallet</button>
            }
            {userContext && <UserButton />}
            {!isConnected ? (
                <button onClick={connectExistingWallet}>Connect Wallet</button>
            ) : (
                <button onClick={sendTx}>Send Transaction</button>
            )}
          </CivicAuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
  );
};

export default App;
