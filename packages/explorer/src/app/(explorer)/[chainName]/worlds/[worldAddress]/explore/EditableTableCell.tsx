import { LoaderIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Hex } from "viem";
import { useAccount, useConfig } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ChangeEvent, useState } from "react";
import { Table } from "@latticexyz/config";
import {
  ValueSchema,
  encodeField,
  getFieldIndex,
  getSchemaTypes,
  getValueSchema,
} from "@latticexyz/protocol-parser/internal";
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "../../../../../../components/ui/Checkbox";
import { useChain } from "../../../../hooks/useChain";

type Props = {
  name: string;
  value: unknown;
  table: Table;
  keyTuple: readonly Hex[];
};

export function EditableTableCell({ name, table, keyTuple, value: defaultValue }: Props) {
  const [value, setValue] = useState<unknown>(defaultValue);
  const { openConnectModal } = useConnectModal();
  const wagmiConfig = useConfig();
  const queryClient = useQueryClient();
  const { worldAddress } = useParams();
  const { id: chainId } = useChain();
  const account = useAccount();
  const valueSchema = getValueSchema(table);
  const fieldType = valueSchema?.[name as never]?.type;

  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: unknown) => {
      if (!fieldType) throw new Error("Field type not found");

      const fieldIndex = getFieldIndex<ValueSchema>(getSchemaTypes(valueSchema), name);
      const encodedFieldValue = encodeField(fieldType, newValue);
      const txHash = await writeContract(wagmiConfig, {
        abi: IBaseWorldAbi,
        address: worldAddress as Hex,
        functionName: "setField",
        args: [table.tableId, keyTuple, fieldIndex, encodedFieldValue],
        chainId,
      });

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      return { txHash, receipt };
    },
    onMutate: () => {
      const toastId = toast.loading("Transaction submitted");
      return { toastId };
    },
    onSuccess: ({ txHash }, newValue, { toastId }) => {
      setValue(newValue);
      toast.success(`Transaction successful with hash: ${txHash}`, {
        id: toastId,
      });
      queryClient.invalidateQueries({
        queryKey: [
          "balance",
          {
            address: account.address,
            chainId,
          },
        ],
      });
    },
    onError: (error, _, context) => {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong. Please try again.", {
        id: context?.toastId,
      });
      setValue(defaultValue);
    },
  });

  const handleSubmit = (newValue: unknown) => {
    if (!account.isConnected) {
      return openConnectModal?.();
    }
    mutate(newValue);
  };

  if (fieldType === "bool") {
    return (
      <div className="flex items-center gap-1">
        <Checkbox
          id={`checkbox-${name}`}
          checked={Boolean(value)}
          onCheckedChange={handleSubmit}
          disabled={isPending}
        />
        {isPending && <LoaderIcon className="h-4 w-4 animate-spin" />}
      </div>
    );
  }

  return (
    <div className="w-full">
      {!isPending && (
        <form
          onSubmit={(evt) => {
            evt.preventDefault();
            handleSubmit(value);
          }}
        >
          <input
            className="w-full bg-transparent px-2 py-4"
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setValue(evt.target.value)}
            onBlur={(evt) => {
              const newValue = evt.target.value;
              if (newValue !== String(defaultValue)) {
                handleSubmit(newValue);
              }
            }}
            value={String(value)}
            disabled={isPending}
          />
        </form>
      )}

      {isPending && (
        <div className="flex items-center gap-1 px-2">
          {String(value)}
          <LoaderIcon className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
