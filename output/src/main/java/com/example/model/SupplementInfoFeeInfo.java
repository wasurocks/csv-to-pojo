@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "SupplementInfoFeeInfo", description = "")
public class SupplementInfoFeeInfo {
    @Schema(description = "Manage fee by KBN flag Y = Manage fee by KBN , N = Manage fee by channel", required = true)
    @JsonProperty("manageFeeByKBN")
    private String manageFeeByKBN;
    
    @Schema(description = "Region area code for creditor.")
    @JsonProperty("cdtrRegionArea")
    private String cdtrRegionArea;
    
    @Schema(description = "Flag for automatic fee calculation.")
    @JsonProperty("autoFeeFlag")
    private String autoFeeFlag;
    
    @Schema(description = "Total fee applicable for the transaction.")
    @JsonProperty("totalFee")
    private Double totalFee;
    
    @Schema(description = "Lease line fee applicable if fund_sof = 3.")
    @JsonProperty("leaseLine")
    private Double leaseLine;
    
    @Schema(description = "Inter-region deposit fee applicable if fund_sof = 3.")
    @JsonProperty("depositInterRegionFee")
    private Double depositInterRegionFee;
    
    @Schema(description = "Bahtnet transaction fee.")
    @JsonProperty("bahtnetFee")
    private Double bahtnetFee;
    
    @Schema(description = "Inter-region Bahtnet fee applicable if auto_fee_flag = 2.")
    @JsonProperty("bahtnetInterRegionFee")
    private Double bahtnetInterRegionFee;
    
    @Schema(description = "Method of fee collection (1 = cash, 2 = transfer, 3 = deduction).")
    @JsonProperty("feeSof")
    private String feeSof;
    
    @Schema(description = "Tax Number 13 digits (Mandatory when Flag Refund Tax = Y)")
    @JsonProperty("taxNo")
    private String taxNo;
    
    @Schema(description = "Flag Refund Tax (Flag คืนภาษี) Y = คืนภาษี, N = ไม่คืนภาษี")
    @JsonProperty("refundTaxFlag")
    private String refundTaxFlag;
    
}
