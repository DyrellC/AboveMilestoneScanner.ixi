var System = java.lang.System;

var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var ErrorResponse = iri.service.dto.ErrorResponse;
var tvm = iri.controllers.TransactionViewModel;
var spentAddressClass = iri.model.persistables.SpentAddress;

var tangle = IOTA.tangle;
var snapshotProvider = IOTA.snapshotProvider;
var bundleValidator =  IOTA.bundleValidator;
var spentAddressesService = IOTA.spentAddressesService;
var spentAddressesProvider = IOTA.spentAddressesProvider;

var Set = Java.type('java.util.LinkedHashSet');
var Queue = Java.type('java.util.LinkedList');


function persistSpentAddressesAboveLatestMilestone(){
    var analyzedCount = 0;
    var transactionsCount = 0;

    var snapshot = snapshotProvider.getLatestSnapshot();
    var milestoneHash = snapshot.getInitialHash();
    var milestoneIndex = snapshot.getInitialIndex();

    var processedTransactions = new Set();
    var validSpends = new Set();
    var hashesToAnalyze = new Queue();

    var nextHash;
    var firstRun = true;

    print("Scanning for spent addresses...");
    var spentAddressesCountBefore = spentAddressesProvider.getAllAddresses().size();
    print("Starting with ", spentAddressesCountBefore, " spent addresses");

    hashesToAnalyze.add(milestoneHash);
    while((nextHash = hashesToAnalyze.poll()) != null) {
        try {
            var tx = tvm.fromHash(tangle, nextHash);
            var hashes = tx.getApprovers(tangle).getHashes();
            hashes.forEach(function (h) {
                if(h != null) {
                    if (processedTransactions.add(h)) {
                        if(!hashesToAnalyze.contains(h)) {
                            hashesToAnalyze.add(h);
                        }

                        var current = tvm.fromHash(tangle, h);

                        if (current.snapshotIndex() == 0 && current.value() > 0 && current.getCurrentIndex() == 0) {
                            transactionsCount += 1;
                            var bundleTxs = bundleValidator.validate(tangle, snapshotProvider.getInitialSnapshot(), h);
                            if(bundleTxs != null && bundleTxs.size() !== 0) {
                                if(!iri.BundleValidator.isInconsistent(bundleTxs)){
                                    for(var tx in bundleTxs) {
                                        if (bundleTxs[tx].value() < 0 && spentAddressesService.wasTransactionSpentFrom(bundleTxs[tx])) {
                                            validSpends.add(bundleTxs[tx].getAddressHash())
                                        }
                                    }
                                    spentAddressesService.persistValidatedSpentAddressesAsync(bundleTxs);

                                }
                            }
                        }

                        analyzedCount += 1;
                        if(analyzedCount % 25000 === 0) {
                            print("\n" + analyzedCount + " tx's analyzed.\n" + transactionsCount +
                                " value transactions found.\n" + validSpends.size() + " valid spent addresses.\n");
                        }

                    }
                }
            });

            if(hashesToAnalyze.size() === 0 && !firstRun){
                print("Stopping scan");
                break;
            }

            if(firstRun){
                firstRun = false;
            }
        } catch(err){
            print(err);
        }
    }

    print("Scanning for spent addresses...");
    var spentAddressesCountAfter = spentAddressesProvider.getAllAddresses().size();
    print("Ending with ", spentAddressesCountAfter, " spent addresses");

    return Response.create({
        totalAnalyzed: analyzedCount,
        valueTransactionsFound: transactionsCount,
        validSpends: validSpends.size(),
        milestoneHash: milestoneHash.toString(),
        milestoneIndex: milestoneIndex,
        spentAddressesBefore: spentAddressesCountBefore,
        spentAddressesAfter: spentAddressesCountAfter
    });
}

API.put("persistSpentAddresses", new Callable({ call: persistSpentAddressesAboveLatestMilestone }));