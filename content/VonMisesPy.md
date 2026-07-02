```python

import math
from odbAccess import openOdb, Odb
from abaqus.Odb.FieldValue import FieldValue
from sys import argv, exit


def rightTrim(input, suffix):
    if input.find(suffix) == -1:
        input = input + suffix
    return input


from dataclasses import dataclass
from typing import Any, Callable, Generic, Optional, Tuple, TypeVar


@dataclass
class StepFrame:
    stepName: str
    step: Optional[int]
    frame: int

    def __str__(self) -> str:
        return f'"{self.stepName}" (S{self.step}) F{self.frame}'

    def __hash__(self):
        return hash((self.stepName, self.frame))


@dataclass
class DataPoint:
    fieldValue: FieldValue
    element: Optional[int]
    node: Optional[int]

    def __str__(self) -> str:
        return f"{self.fieldValue} in element #{self.element}"


FieldComparisonCallable = Callable[[FieldValue], float]


def getMaxFieldValue(
    odb: Odb,
    elsetName: Optional[str],
    fieldOutputName: str,
    fieldComparisonKey: FieldComparisonCallable,
) -> dict[StepFrame, Optional[DataPoint]]:
    """Print max mises location and value given odbName
    and elset(optional)
    """
    assembly = odb.rootAssembly

    # process the element subset
    if elsetName:
        if elsetName in assembly.elementSets:
            elemset = assembly.elementSets[elsetName]
        else:
            raise ValueError(
                "An assembly level elset named %s does"
                "not exist in the output database %s" % (elsetName, odbName)
            )
    else:
        elemset = None

    isFieldPresent = False
    maxFieldKey = -float("inf")
    maxFieldValues = {}

    for stepName, step in odb.steps.items():
        print("Processing Step:", step.number)
        for frame in step.frames:
            stepFrame = StepFrame(stepName, step.number, frame.incrementNumber)
            frameMaxValue: Optional[DataPoint] = None
            frameFields = frame.fieldOutputs
            if fieldOutputName in frameFields:
                isFieldPresent = 1
                fieldOutput = frameFields[fieldOutputName]
                if elemset:
                    fieldOutput = fieldOutput.getSubset(region=elemset)
                fieldValueArray = fieldOutput.values
                if fieldValueArray is None:
                    continue
                for fieldValue in fieldValueArray:
                    fieldKey = fieldComparisonKey(fieldValue)
                    if fieldKey > maxFieldKey:
                        maxFieldKey = fieldKey
                        frameMaxValue = DataPoint(
                            fieldValue=fieldValue,
                            element=fieldValue.elementLabel,
                            node=fieldValue.nodeLabel,
                        )
            maxFieldValues[stepFrame] = frameMaxValue
        # end for frame

    if not isFieldPresent:
        raise ValueError("No field present in element set")

    return maxFieldValues


if __name__ == "__main__":
    odbName = None
    elsetName = None
    argList = argv
    argc = len(argList)
    i = 0
    while i < argc:
        if argList[i][:2] == "-o":
            i += 1
            name = argList[i]
            odbName = rightTrim(name, ".odb")
        elif argList[i][:2] == "-e":
            i += 1
            elsetName = argList[i]
        elif argList[i][:2] == "-h":
            print(__doc__)
            exit(0)
        i += 1
    if not (odbName):
        print(" **ERROR** output database name is not provided")
        print(__doc__)
        exit(1)

    odb = openOdb(odbName)

    fieldComparisonKey: FieldComparisonCallable = (
        lambda fv: fv.mises if fv.mises is not None else math.nan
    )

    try:
        maxMisesValues = getMaxFieldValue(odb, elsetName, "S", fieldComparisonKey)
        for stepFrame, maxMisesPoint in maxMisesValues.items():
            value = None
            if maxMisesPoint is not None:
                value = fieldComparisonKey(maxMisesPoint.fieldValue)
            print(f"at {stepFrame}: Max Von Mises Stress = {value}")
    except Exception as e:
        print(e)

    fieldComparisonKey: FieldComparisonCallable = lambda fv: fv.data[0]

    try:
        maxMisesValues = getMaxFieldValue(odb, elsetName, "PE", fieldComparisonKey)
        for stepFrame, maxMisesPoint in maxMisesValues.items():
            value = None
            if maxMisesPoint is not None:
                value = maxMisesPoint.fieldValue.data
            print(f"at {stepFrame}: Max Plastic Strain = {value}")
    except Exception as e:
        print(e)

    odb.close()

```