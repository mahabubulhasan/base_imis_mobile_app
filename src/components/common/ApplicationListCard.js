import { View, Pressable } from "react-native";
import React, { memo, useState } from "react";
import { Divider, Text, Subheading } from "react-native-paper";
import { COLORS } from "../../core/theme";
import { StyleSheet } from "react-native";
import dayjs from "dayjs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";

const ApplicationListCard = ({
  item,
  onCall,
  onLocation,
  onStart,
  locationAvailable = true,
}) => {
  const [expanded, setExpanded] = useState(true);

  const { contentsLabel } = useSelector((state) => state.auth);
  const getLabel = (key) => contentsLabel?.[key] || key;

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Icon name="file" color={COLORS.primary} size={22} />
        <Subheading style={styles.title} numberOfLines={1}>{`${getLabel(
          "Application ID"
        )}: #${item?.id ? item?.id : "N/A"} `}</Subheading>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={22} />
      </Pressable>

      {expanded && (
        <>
          <Divider />
          <Divider />
          <Divider style={styles.divider} />
          <View style={styles.row}>
            <Text>{getLabel("Application Date")}: </Text>
            <Text style={styles.text}>
              {item?.created_at
                ? dayjs(item?.created_at).format("DD MMMM YYYY")
                : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Tax ID")}: </Text>
            <Text style={styles.text}>
              {item?.tax_code ? item?.tax_code : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Customer Name")}: </Text>
            <Text style={styles.text}>
              {item?.applicant_name ? item?.applicant_name : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Ward")}: </Text>
            <Text style={styles.text}>{item?.ward ? item?.ward : "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Holding Owner Name")}: </Text>
            <Text style={styles.text}>
              {item?.customer_name ? item?.customer_name : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Customer Contact")}:</Text>
            <Text style={styles.text}>
              {item?.applicant_contact ? item?.applicant_contact : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Road Code")}:</Text>
            <Text style={styles.text}>
              {item?.road_code ? item?.road_code : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Address")}: </Text>
            <Text style={styles.text}>
              {item?.address ? item?.address : "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Notes")}: </Text>
            <Text style={styles.text}>{item?.note ? item?.note : "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text>{getLabel("Proposed Emptying Date")}:</Text>
            <Text style={styles.text}>
              {item?.proposed_emptying_date
                ? dayjs(item?.proposed_emptying_date).format("DD MMMM YYYY")
                : "N/A"}
            </Text>
          </View>
        </>
      )}
      <Divider />
      <Divider />
      <Divider style={styles.divider} />
      <View style={styles.footer}>
        <Icon name="phone" size={20} color={COLORS.primary} onPress={onCall} />
        <Icon
          name="map"
          size={20}
          color={locationAvailable ? COLORS.primary : COLORS.disabled}
          onPress={locationAvailable ? onLocation : undefined}
        />
        <Icon
          name="form-select"
          size={20}
          color={COLORS.primary}
          onPress={onStart}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 10,
    elevation: 3,
    marginHorizontal: 2,
    borderRadius: 10,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  title: {
    fontWeight: "bold",
    overflow: "hidden",
    paddingHorizontal: 30,
  },
  row: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    paddingHorizontal: 5,
  },
  divider: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
});

export default memo(ApplicationListCard);
