import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import broadcaster from "../utils/Broadcaster";
import DateTimeFormatter from "../utils/DateTimeFormatter";
import EventHandleContext from "./EventHandleContext";

import type ColumnOptions from "../types/CellOptions";
import { TableStatic } from "../utils";
import { CellViewProps } from "../utils/TableStatic";

interface ICellProps {
  config: ColumnOptions;
  parentIndex: number;
  ownIndex: number;
  matrix: any[][];
  props?: CellViewProps & ViewStyle;
}

const Cell: FC<ICellProps> = ({ config, parentIndex, ownIndex, matrix, props }) => {
	const [cellValue, setCellValue] = useState<any>();
	const [pressed, setPressed] = useState(false);
	const { onCellPress, onRowPress } = useContext(EventHandleContext);

	const onRowPressInListener = useCallback((val: boolean) => {
		setPressed(val);
	}, []);

	const onRowPressOutListener = useCallback((val: boolean) => {
		setPressed(val);
	}, []);

	const onLongPressInHandler = useCallback((event: GestureResponderEvent) => {
		onCellPress?.(event, matrix[parentIndex][ownIndex]);

		if (onRowPress) {
			const vals = [];

			//collect all cell values for curren row
			for (let index = 0; index < matrix.length; index++) {
				const element = matrix[index][ownIndex];
				vals.push(element);
			}
			onRowPress(event, vals);
		}

		broadcaster.emit(`row:pressIn:${ownIndex}`, true);
		setPressed(true);
	}, []);

	const onRowPressOutHandler = useCallback(() => {
		broadcaster.emit(`row:pressOut:${ownIndex}`, false);
		setPressed(false);
	}, []);

	function updateCell() {
		const val = matrix[parentIndex][ownIndex];
		setCellValue(val);
	}

	useEffect(() => {
		broadcaster.addListener(`cell:update:force${parentIndex}${ownIndex}`, updateCell);
		broadcaster.addListener(`row:pressIn:${ownIndex}`, onRowPressInListener);
		broadcaster.addListener(`row:pressOut:${ownIndex}`, onRowPressOutListener);

		return () => {
			broadcaster.removeListener(`cell:update:force${parentIndex}${ownIndex}`, updateCell);
			broadcaster.removeListener(`row:pressIn:${ownIndex}`, onRowPressInListener);
			broadcaster.removeListener(`row:pressOut:${ownIndex}`, onRowPressOutListener);
		};
	}, []);

	const preparedValue = useMemo(() => {
		if (cellValue === null || cellValue === undefined) return <View />;

		switch (config.type) {
		case "string": {
			return (
				<Text style={[styles.def, TableStatic.stringCellTextStyle]} numberOfLines={1}>
					{cellValue}
				</Text>
			);
		}
		case "number": {
			return (
				<Text style={[styles.def, TableStatic.numericCellTextStyle]} numberOfLines={1}>
					{cellValue}
				</Text>
			);
		}
		case "date": {
			const parsedDate = DateTimeFormatter.formatDate(cellValue, config.format, config.locale);
			return (
				<Text style={[styles.def, TableStatic.dateCellTextStyle]} numberOfLines={1}>
					{parsedDate.toString()}
				</Text>
			);
		}
		case "link": {
			return <Text>{cellValue}</Text>;
		}
		}
	}, [cellValue]);

	const pressedColor = useMemo(() => {
		if (TableStatic.cellContainerStyle.cellHighligntBackgroundColor) {
			return pressed ? TableStatic.cellContainerStyle.cellHighligntBackgroundColor : undefined;
		}

		if (props?.cellHighligntBackgroundColor) {
			return pressed ? props.cellHighligntBackgroundColor : undefined;
		}

		return pressed ? "#DCDCDC" : undefined;
	}, [props, pressed]);

	return (
		<Pressable
			style={[styles.cell, { backgroundColor: pressedColor }]}
			onLongPress={onLongPressInHandler}
			delayLongPress={TableStatic.cellContainerStyle.longPressDelay ?? 100}
			onPressOut={onRowPressOutHandler}
		>
			{preparedValue}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	cell: {
		flex: 1,
		minHeight: 40,
		width: "auto",
		borderWidth: 0.3,
		borderColor: "black",
		justifyContent: "center",
		alignItems: "center",
		padding: 8,
		backgroundColor: "blue",
	},
	def: {},
});

export default Cell;