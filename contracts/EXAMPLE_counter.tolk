// REFERENCE EXAMPLE from TON Tutorial (ton.md lines 293-338)
// This is a working example to show the exact Tolk patterns
// Contract engineers should follow this structure for GroupVault, ExpenseSplitter, GoalContract

struct Storage {
    counter: uint64;
}

fun Storage.load() {
    return Storage.fromCell(contract.getData());
}

fun Storage.save(self) {
    contract.setData(self.toCell());
}

struct(0x7e8764ef) IncreaseCounter {
    increaseBy: uint32
}

struct(0x3a752f06) ResetCounter {}

type AllowedMessage = IncreaseCounter | ResetCounter;

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        IncreaseCounter => {
            var storage = lazy Storage.load();
            storage.counter += msg.increaseBy;
            storage.save();
        }

        ResetCounter => {
            var storage = lazy Storage.load();
            storage.counter = 0;
            storage.save();
        }

        else => {
            assert(in.body.isEmpty()) throw 0xFFFF;
        }
    }
}

get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}
